import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { getCanvasState, getProjectById } from '../db/queries.js';
import { createVersion, listVersions, getVersion } from '../db/versions.js';
import { requireProjectAccess, verifyTokenAndGetUser } from '../middleware/auth.js';
import { addClient, broadcast } from '../sse/connections.js';

const router = Router();

// --- Safe JSON parse for DB values ---
function safeParseJSON(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseCanvasFields(record) {
  const nodes = safeParseJSON(record.nodes);
  const edges = safeParseJSON(record.edges);
  const viewport = safeParseJSON(record.viewport);
  if (nodes === null || edges === null || viewport === null) {
    return null;
  }
  return { nodes, edges, viewport };
}

// --- Input validation helpers ---
const MAX_NODES = 2000;
const MAX_EDGES = 5000;
const MAX_STRING_LENGTH = 10000; // per node text field
const VALID_NODE_TYPES = ['activity', 'step', 'storyCard', 'annotation'];

function validateCanvasPayload(nodes, edges, viewport) {
  const errors = [];

  // nodes must be an array within size limits
  if (!Array.isArray(nodes)) {
    errors.push('nodes must be an array');
  } else {
    if (nodes.length > MAX_NODES) {
      errors.push(`nodes exceeds maximum count of ${MAX_NODES} (got ${nodes.length})`);
    }
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (!n || typeof n !== 'object') {
        errors.push(`nodes[${i}] must be an object`);
        continue;
      }
      if (typeof n.id !== 'string' || n.id.length === 0 || n.id.length > 200) {
        errors.push(`nodes[${i}].id must be a non-empty string (max 200 chars)`);
      }
      if (n.type && !VALID_NODE_TYPES.includes(n.type)) {
        errors.push(`nodes[${i}].type "${n.type}" is not valid`);
      }
      if (n.data) {
        if (typeof n.data.title === 'string' && n.data.title.length > MAX_STRING_LENGTH) {
          errors.push(`nodes[${i}].data.title exceeds ${MAX_STRING_LENGTH} chars`);
        }
        if (typeof n.data.description === 'string' && n.data.description.length > MAX_STRING_LENGTH) {
          errors.push(`nodes[${i}].data.description exceeds ${MAX_STRING_LENGTH} chars`);
        }
      }
    }
  }

  // edges must be an array within size limits
  if (!Array.isArray(edges)) {
    errors.push('edges must be an array');
  } else {
    if (edges.length > MAX_EDGES) {
      errors.push(`edges exceeds maximum count of ${MAX_EDGES} (got ${edges.length})`);
    }
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      if (!e || typeof e !== 'object') {
        errors.push(`edges[${i}] must be an object`);
        continue;
      }
      if (typeof e.id !== 'string' || e.id.length === 0) {
        errors.push(`edges[${i}].id must be a non-empty string`);
      }
      if (typeof e.source !== 'string' || typeof e.target !== 'string') {
        errors.push(`edges[${i}] must have source and target strings`);
      }
    }
  }

  // viewport must be an object with x, y, zoom numbers
  if (!viewport || typeof viewport !== 'object') {
    errors.push('viewport must be an object');
  } else {
    if (typeof viewport.x !== 'number' || typeof viewport.y !== 'number' || typeof viewport.zoom !== 'number') {
      errors.push('viewport must have numeric x, y, and zoom');
    }
  }

  return errors;
}

// Load canvas state
router.get('/:projectId', requireProjectAccess('viewer'), (req, res) => {
  const canvas = getCanvasState(req.params.projectId);
  if (!canvas) return res.status(404).json({ error: 'Canvas not found' });

  const parsed = parseCanvasFields(canvas);
  if (!parsed) return res.status(500).json({ error: 'Corrupt canvas data in database' });

  res.json({
    nodes: parsed.nodes,
    edges: parsed.edges,
    viewport: parsed.viewport,
    updated_at: canvas.updated_at,
    role: req.projectRole,
    showDescriptions: canvas.show_descriptions !== 0,
    showAcceptanceCriteria: canvas.show_acceptance_criteria !== 0,
  });
});

// Save canvas state (auto-save target) + create version
router.put('/:projectId', requireProjectAccess('editor'), (req, res) => {
  const { nodes, edges, viewport, label } = req.body;
  const { projectId } = req.params;

  const validationErrors = validateCanvasPayload(nodes, edges, viewport);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Invalid canvas data', details: validationErrors });
  }

  const canvas = getCanvasState(projectId);
  if (!canvas) return res.status(404).json({ error: 'Canvas not found' });

  const saveTransaction = db.transaction(() => {
    db.prepare(
      "UPDATE canvas_states SET nodes = ?, edges = ?, viewport = ?, updated_at = datetime('now') WHERE project_id = ?"
    ).run(JSON.stringify(nodes), JSON.stringify(edges), JSON.stringify(viewport), projectId);

    db.prepare("UPDATE projects SET updated_at = datetime('now') WHERE id = ?").run(projectId);

    return createVersion(projectId, nodes, edges, viewport, label || 'Auto-save');
  });

  const version = saveTransaction();

  // Broadcast canvas_update so connected frontends can reload
  const isMcpSource = req.headers['x-source'] === 'mcp';
  broadcast(projectId, 'canvas_update', { reason: 'external_update' }, isMcpSource ? undefined : req.user.id);

  res.json({ success: true, version });
});

// Import JSON → replace canvas state + create version
router.post('/:projectId/import', requireProjectAccess('editor'), (req, res) => {
  const { nodes, edges, viewport } = req.body;
  const { projectId } = req.params;

  const importedNodes = nodes || [];
  const importedEdges = edges || [];
  const importedViewport = viewport || { x: 0, y: 0, zoom: 1 };

  const validationErrors = validateCanvasPayload(importedNodes, importedEdges, importedViewport);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Invalid canvas data', details: validationErrors });
  }

  const canvas = getCanvasState(projectId);
  if (!canvas) return res.status(404).json({ error: 'Canvas not found' });

  const importTransaction = db.transaction(() => {
    db.prepare(
      "UPDATE canvas_states SET nodes = ?, edges = ?, viewport = ?, updated_at = datetime('now') WHERE project_id = ?"
    ).run(
      JSON.stringify(importedNodes),
      JSON.stringify(importedEdges),
      JSON.stringify(importedViewport),
      projectId
    );

    // Import comments if provided
    const importedComments = req.body.comments;
    if (Array.isArray(importedComments) && importedComments.length > 0) {
      const nodeIds = new Set(importedNodes.map(n => n.id));
      const insertComment = db.prepare(
        'INSERT INTO card_comments (id, project_id, node_id, user_id, content, is_system_message, resolved_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );
      for (const c of importedComments) {
        if (!nodeIds.has(c.node_id)) continue;
        insertComment.run(
          uuidv4(),
          projectId,
          c.node_id,
          req.user.id,
          c.content || '',
          c.is_system_message ? 1 : 0,
          c.resolved_at || null,
          c.created_at || new Date().toISOString()
        );
      }
    }

    return createVersion(projectId, importedNodes, importedEdges, importedViewport, 'Import');
  });

  const version = importTransaction();

  res.json({ success: true, version });
});

// Export canvas state as JSON
router.get('/:projectId/export', requireProjectAccess('viewer'), (req, res) => {
  const canvas = getCanvasState(req.params.projectId);
  if (!canvas) return res.status(404).json({ error: 'Canvas not found' });

  const parsed = parseCanvasFields(canvas);
  if (!parsed) return res.status(500).json({ error: 'Corrupt canvas data in database' });

  const project = getProjectById(req.params.projectId);

  const exportData = {
    project: {
      name: project.name,
      description: project.description,
      exported_at: new Date().toISOString(),
    },
    canvas: {
      nodes: parsed.nodes,
      edges: parsed.edges,
      viewport: parsed.viewport,
    },
  };

  // Fetch all comments for the project
  const comments = db.prepare(`
    SELECT c.node_id, c.content, u.name as user_name, c.is_system_message, c.resolved_at, c.created_at
    FROM card_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.project_id = ?
    ORDER BY c.node_id, c.created_at ASC
  `).all(req.params.projectId);

  exportData.comments = comments;

  res.setHeader('Content-Disposition', `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '_')}_story_map.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.json(exportData);
});

// List versions for a project
router.get('/:projectId/versions', requireProjectAccess('viewer'), (req, res) => {
  const { projectId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;

  const versions = listVersions(projectId, limit, offset);
  res.json({ versions });
});

// Get a specific version
router.get('/:projectId/versions/:versionId', requireProjectAccess('viewer'), (req, res) => {
  const { projectId, versionId } = req.params;

  const version = getVersion(projectId, versionId);
  if (!version) return res.status(404).json({ error: 'Version not found' });

  const parsed = parseCanvasFields(version);
  if (!parsed) return res.status(500).json({ error: 'Corrupt version data in database' });

  res.json({
    id: version.id,
    version_number: version.version_number,
    label: version.label,
    nodes: parsed.nodes,
    edges: parsed.edges,
    viewport: parsed.viewport,
    created_at: version.created_at,
  });
});

// Restore a version
router.post('/:projectId/versions/:versionId/restore', requireProjectAccess('editor'), (req, res) => {
  const { projectId, versionId } = req.params;

  const version = getVersion(projectId, versionId);
  if (!version) return res.status(404).json({ error: 'Version not found' });

  const parsed = parseCanvasFields(version);
  if (!parsed) return res.status(500).json({ error: 'Corrupt version data in database' });
  const { nodes, edges, viewport } = parsed;

  const restoreTransaction = db.transaction(() => {
    db.prepare(
      "UPDATE canvas_states SET nodes = ?, edges = ?, viewport = ?, updated_at = datetime('now') WHERE project_id = ?"
    ).run(version.nodes, version.edges, version.viewport, projectId);

    db.prepare("UPDATE projects SET updated_at = datetime('now') WHERE id = ?").run(projectId);

    return createVersion(projectId, nodes, edges, viewport, `Restored from v${version.version_number}`);
  });

  const newVersion = restoreTransaction();

  res.json({
    success: true,
    version: newVersion,
    nodes,
    edges,
    viewport,
  });
});

// Create a named snapshot from current canvas state
router.post('/:projectId/versions', requireProjectAccess('editor'), (req, res) => {
  const { projectId } = req.params;
  const { label } = req.body;

  if (!label) return res.status(400).json({ error: 'Label is required' });

  const canvas = getCanvasState(projectId);
  if (!canvas) return res.status(404).json({ error: 'Canvas not found' });

  const parsed = parseCanvasFields(canvas);
  if (!parsed) return res.status(500).json({ error: 'Corrupt canvas data in database' });
  const { nodes, edges, viewport } = parsed;

  const version = createVersion(projectId, nodes, edges, viewport, label);

  res.json({ success: true, version });
});

// Save visibility settings (editor-only)
router.put('/:projectId/visibility', requireProjectAccess('editor'), (req, res) => {
  const { showDescriptions, showAcceptanceCriteria } = req.body;
  const { projectId } = req.params;

  const canvas = getCanvasState(projectId);
  if (!canvas) return res.status(404).json({ error: 'Canvas not found' });

  db.prepare(
    "UPDATE canvas_states SET show_descriptions = ?, show_acceptance_criteria = ?, updated_at = datetime('now') WHERE project_id = ?"
  ).run(showDescriptions ? 1 : 0, showAcceptanceCriteria ? 1 : 0, projectId);

  // Broadcast to other connected clients
  broadcast(projectId, 'visibility', { showDescriptions, showAcceptanceCriteria }, req.user.id);

  res.json({ success: true });
});

// SSE endpoint for live updates
router.get('/:projectId/events', async (req, res) => {
  const { projectId } = req.params;
  const token = req.query.token;

  // Auth via query param token
  let user;
  try {
    user = await verifyTokenAndGetUser(token);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Check project access inline (viewer or above)
  const project = getProjectById(projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const authEnabled = process.env.AUTH_ENABLED === 'true';
  const isOwner = project.owner_id === user.id || (!authEnabled && !project.owner_id);
  if (!isOwner) {
    const share = db.prepare(
      'SELECT role FROM project_shares WHERE project_id = ? AND user_id = ?'
    ).get(projectId, user.id);
    if (!share) return res.status(403).json({ error: 'Access denied' });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  // Send initial keepalive
  res.write(':ok\n\n');

  // Keepalive every 30s
  const keepalive = setInterval(() => {
    res.write(':keepalive\n\n');
  }, 30000);

  res.on('close', () => {
    clearInterval(keepalive);
  });

  addClient(projectId, user.id, res);
});

export default router;
