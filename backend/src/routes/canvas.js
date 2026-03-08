import { Router } from 'express';
import db from '../db/database.js';
import { createVersion, listVersions, getVersion } from '../db/versions.js';
import { requireProjectAccess, verifyTokenAndGetUser } from '../middleware/auth.js';
import { addClient, broadcast } from '../sse/connections.js';

const router = Router();

// Load canvas state
router.get('/:projectId', requireProjectAccess('viewer'), (req, res) => {
  const canvas = db.prepare('SELECT * FROM canvas_states WHERE project_id = ?').get(req.params.projectId);
  if (!canvas) return res.status(404).json({ error: 'Canvas not found' });

  res.json({
    nodes: JSON.parse(canvas.nodes),
    edges: JSON.parse(canvas.edges),
    viewport: JSON.parse(canvas.viewport),
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

  const canvas = db.prepare('SELECT * FROM canvas_states WHERE project_id = ?').get(projectId);
  if (!canvas) return res.status(404).json({ error: 'Canvas not found' });

  const saveTransaction = db.transaction(() => {
    db.prepare(
      "UPDATE canvas_states SET nodes = ?, edges = ?, viewport = ?, updated_at = datetime('now') WHERE project_id = ?"
    ).run(JSON.stringify(nodes), JSON.stringify(edges), JSON.stringify(viewport), projectId);

    db.prepare("UPDATE projects SET updated_at = datetime('now') WHERE id = ?").run(projectId);

    return createVersion(projectId, nodes, edges, viewport, label || 'Auto-save');
  });

  const version = saveTransaction();

  res.json({ success: true, version });
});

// Import JSON → replace canvas state + create version
router.post('/:projectId/import', requireProjectAccess('editor'), (req, res) => {
  const { nodes, edges, viewport } = req.body;
  const { projectId } = req.params;

  const canvas = db.prepare('SELECT * FROM canvas_states WHERE project_id = ?').get(projectId);
  if (!canvas) return res.status(404).json({ error: 'Canvas not found' });

  const importedNodes = nodes || [];
  const importedEdges = edges || [];
  const importedViewport = viewport || { x: 0, y: 0, zoom: 1 };

  const importTransaction = db.transaction(() => {
    db.prepare(
      "UPDATE canvas_states SET nodes = ?, edges = ?, viewport = ?, updated_at = datetime('now') WHERE project_id = ?"
    ).run(
      JSON.stringify(importedNodes),
      JSON.stringify(importedEdges),
      JSON.stringify(importedViewport),
      projectId
    );

    return createVersion(projectId, importedNodes, importedEdges, importedViewport, 'Import');
  });

  const version = importTransaction();

  res.json({ success: true, version });
});

// Export canvas state as JSON
router.get('/:projectId/export', requireProjectAccess('viewer'), (req, res) => {
  const canvas = db.prepare('SELECT * FROM canvas_states WHERE project_id = ?').get(req.params.projectId);
  if (!canvas) return res.status(404).json({ error: 'Canvas not found' });

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId);

  const exportData = {
    project: {
      name: project.name,
      description: project.description,
      exported_at: new Date().toISOString(),
    },
    canvas: {
      nodes: JSON.parse(canvas.nodes),
      edges: JSON.parse(canvas.edges),
      viewport: JSON.parse(canvas.viewport),
    },
  };

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

  res.json({
    id: version.id,
    version_number: version.version_number,
    label: version.label,
    nodes: JSON.parse(version.nodes),
    edges: JSON.parse(version.edges),
    viewport: JSON.parse(version.viewport),
    created_at: version.created_at,
  });
});

// Restore a version
router.post('/:projectId/versions/:versionId/restore', requireProjectAccess('editor'), (req, res) => {
  const { projectId, versionId } = req.params;

  const version = getVersion(projectId, versionId);
  if (!version) return res.status(404).json({ error: 'Version not found' });

  const nodes = JSON.parse(version.nodes);
  const edges = JSON.parse(version.edges);
  const viewport = JSON.parse(version.viewport);

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

  const canvas = db.prepare('SELECT * FROM canvas_states WHERE project_id = ?').get(projectId);
  if (!canvas) return res.status(404).json({ error: 'Canvas not found' });

  const nodes = JSON.parse(canvas.nodes);
  const edges = JSON.parse(canvas.edges);
  const viewport = JSON.parse(canvas.viewport);

  const version = createVersion(projectId, nodes, edges, viewport, label);

  res.json({ success: true, version });
});

// Save visibility settings (editor-only)
router.put('/:projectId/visibility', requireProjectAccess('editor'), (req, res) => {
  const { showDescriptions, showAcceptanceCriteria } = req.body;
  const { projectId } = req.params;

  const canvas = db.prepare('SELECT * FROM canvas_states WHERE project_id = ?').get(projectId);
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
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
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
