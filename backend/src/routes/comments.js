import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { getUserById, getCanvasState } from '../db/queries.js';
import { requireProjectAccess } from '../middleware/auth.js';
import { broadcast } from '../sse/connections.js';
import { chatCompletion } from '../ai/client.js';
import { EDIT_SYSTEM_PROMPT } from '../ai/prompts.js';
import { decrypt } from '../utils/encryption.js';

const router = Router({ mergeParams: true });

// All comments for a project (grouped by node_id)
router.get('/:projectId/comments', requireProjectAccess('viewer'), (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.name as user_name, u.picture as user_picture
    FROM card_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.project_id = ?
    ORDER BY c.node_id, c.created_at ASC
  `).all(req.params.projectId);

  const grouped = {};
  for (const comment of comments) {
    if (!grouped[comment.node_id]) {
      grouped[comment.node_id] = [];
    }
    grouped[comment.node_id].push(comment);
  }
  res.json(grouped);
});

function getUserApiKey(userId) {
  const row = getUserById(userId);
  if (!row?.openrouter_api_key) return null;
  return decrypt(row.openrouter_api_key);
}

function buildCompactState(nodes, edges) {
  const lines = ['EXISTING NODES:'];
  for (const n of nodes) {
    const d = n.data || {};
    const desc = d.description ? d.description.slice(0, 100) : '';
    lines.push(`  ${n.id} | ${n.type} | pos(${n.position.x},${n.position.y}) | "${d.title || ''}" | priority:${d.priority || '-'} | ${desc}`);
  }
  lines.push('');
  lines.push('EXISTING EDGES:');
  for (const e of edges) {
    lines.push(`  ${e.id} | ${e.source} -> ${e.target} | type:${e.type || 'default'}`);
  }
  return lines.join('\n');
}

// List comments for a node
router.get('/:projectId/nodes/:nodeId/comments', requireProjectAccess('viewer'), (req, res) => {
  const { projectId, nodeId } = req.params;
  const comments = db.prepare(`
    SELECT c.*, u.name as user_name, u.picture as user_picture
    FROM card_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.project_id = ? AND c.node_id = ?
    ORDER BY c.created_at ASC
  `).all(projectId, nodeId);
  res.json(comments);
});

// Add comment to a node
router.post('/:projectId/nodes/:nodeId/comments', requireProjectAccess('viewer'), (req, res) => {
  const { projectId, nodeId } = req.params;
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }
  if (content.length > 5000) {
    return res.status(400).json({ error: 'Content must be at most 5000 characters' });
  }

  const id = uuidv4();
  db.prepare(
    'INSERT INTO card_comments (id, project_id, node_id, user_id, content) VALUES (?, ?, ?, ?, ?)'
  ).run(id, projectId, nodeId, req.user.id, content.trim());

  const comment = db.prepare(`
    SELECT c.*, u.name as user_name, u.picture as user_picture
    FROM card_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(id);

  broadcast(projectId, 'comment_add', { nodeId, commentId: id }, req.user.id);
  res.status(201).json(comment);
});

// Delete a comment
router.delete('/:projectId/comments/:commentId', requireProjectAccess('viewer'), (req, res) => {
  const { projectId, commentId } = req.params;

  const comment = db.prepare(
    'SELECT * FROM card_comments WHERE id = ? AND project_id = ?'
  ).get(commentId, projectId);

  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  // Only allow if user owns the comment or is the project owner
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (comment.user_id !== req.user.id && project?.owner_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to delete this comment' });
  }

  db.prepare('DELETE FROM card_comments WHERE id = ?').run(commentId);
  broadcast(projectId, 'comment_delete', { nodeId: comment.node_id, commentId }, req.user.id);
  res.status(204).end();
});

// Apply discussion via AI
router.post('/:projectId/nodes/:nodeId/comments/apply', requireProjectAccess('editor'), async (req, res) => {
  const { projectId, nodeId } = req.params;
  const { model } = req.body;

  if (!model) {
    return res.status(400).json({ error: 'Model is required' });
  }

  const apiKey = getUserApiKey(req.user.id);
  if (!apiKey) {
    return res.status(403).json({ error: 'No API key configured. Add your OpenRouter API key on the projects page.' });
  }

  // Fetch canvas state
  const canvasState = getCanvasState(projectId);
  if (!canvasState) {
    return res.status(404).json({ error: 'Canvas not found' });
  }

  const nodes = JSON.parse(canvasState.nodes || '[]');
  const edges = JSON.parse(canvasState.edges || '[]');

  // Find the target node
  const targetNode = nodes.find(n => n.id === nodeId);
  if (!targetNode) {
    return res.status(404).json({ error: 'Node not found in canvas' });
  }

  // Fetch comments (last 50)
  const comments = db.prepare(`
    SELECT c.content, u.name as user_name
    FROM card_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.project_id = ? AND c.node_id = ?
    ORDER BY c.created_at ASC
    LIMIT 50
  `).all(projectId, nodeId);

  if (comments.length === 0) {
    return res.status(400).json({ error: 'No comments to apply' });
  }

  // Build focused prompt
  const d = targetNode.data || {};
  const criteria = Array.isArray(d.acceptanceCriteria) ? d.acceptanceCriteria.join(', ') : '';
  const discussionLines = comments.map(c => `${c.user_name || 'Unknown'}: ${c.content}`).join('\n');

  const focusedPrompt = `CARD TO UPDATE:
Node ID: ${targetNode.id}, Type: ${targetNode.type}, Title: "${d.title || ''}"
Description: "${d.description || ''}"
Acceptance Criteria: [${criteria}]

DISCUSSION THREAD:
${discussionLines}

Based on this discussion, update the card. Focus on the discussed changes only.`;

  try {
    const compactState = buildCompactState(nodes, edges);
    const messages = [
      { role: 'system', content: EDIT_SYSTEM_PROMPT },
      { role: 'user', content: `${compactState}\n\nUSER REQUEST: ${focusedPrompt}` },
    ];

    const result = await chatCompletion(apiKey, model, messages, { temperature: 0.4 });

    // Insert system comment
    const systemCommentId = uuidv4();
    db.prepare(
      'INSERT INTO card_comments (id, project_id, node_id, user_id, content, is_system_message) VALUES (?, ?, ?, ?, ?, 1)'
    ).run(systemCommentId, projectId, nodeId, req.user.id, 'Changes from the above discussion have been applied');

    const systemComment = db.prepare(`
      SELECT c.*, u.name as user_name, u.picture as user_picture
      FROM card_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(systemCommentId);

    broadcast(projectId, 'comment_add', { nodeId, commentId: systemCommentId });

    res.json({ operations: result.operations || [], systemComment });
  } catch (err) {
    console.error('AI apply discussion error:', err);
    const clientMessage = err.status === 401 || err.status === 403
      ? 'Invalid API key. Please check your OpenRouter API key.'
      : err.status === 429
        ? 'Rate limit exceeded. Please wait a moment and try again.'
        : 'An error occurred while applying discussion. Please try again or use a different model.';
    res.status(err.status || 500).json({ error: clientMessage });
  }
});

// Resolve comments on a node
router.post('/:projectId/nodes/:nodeId/comments/resolve', requireProjectAccess('editor'), (req, res) => {
  const { projectId, nodeId } = req.params;

  // Mark all unresolved comments as resolved
  const result = db.prepare(
    "UPDATE card_comments SET resolved_at = datetime('now') WHERE project_id = ? AND node_id = ? AND resolved_at IS NULL AND is_system_message = 0"
  ).run(projectId, nodeId);

  if (result.changes === 0) {
    return res.status(400).json({ error: 'No unresolved comments to resolve' });
  }

  // Get user name for the system message
  const user = getUserById(req.user.id);
  const userName = user?.name || 'Unknown';

  // Insert system comment
  const systemCommentId = uuidv4();
  db.prepare(
    'INSERT INTO card_comments (id, project_id, node_id, user_id, content, is_system_message) VALUES (?, ?, ?, ?, ?, 1)'
  ).run(systemCommentId, projectId, nodeId, req.user.id, `Comments resolved by ${userName}`);

  const systemComment = db.prepare(`
    SELECT c.*, u.name as user_name, u.picture as user_picture
    FROM card_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(systemCommentId);

  broadcast(projectId, 'comments_resolve', { nodeId }, req.user.id);

  res.json({ systemComment });
});

// Bulk comment counts for badges (only unresolved, non-system comments)
router.get('/:projectId/comment-counts', requireProjectAccess('viewer'), (req, res) => {
  const rows = db.prepare(
    'SELECT node_id, COUNT(*) as count FROM card_comments WHERE project_id = ? AND resolved_at IS NULL AND is_system_message = 0 GROUP BY node_id'
  ).all(req.params.projectId);

  const counts = {};
  for (const row of rows) {
    counts[row.node_id] = row.count;
  }
  res.json(counts);
});

export default router;
