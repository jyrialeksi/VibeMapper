import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { getUserById, getProjectById, getProjectShare } from '../db/queries.js';
import { chatCompletion } from '../ai/client.js';
import { availableModels } from '../ai/models.js';
import { GENERATE_SYSTEM_PROMPT, EDIT_SYSTEM_PROMPT, ARRANGE_SYSTEM_PROMPT } from '../ai/prompts.js';
import { requireProjectAccess } from '../middleware/auth.js';
import { decrypt } from '../utils/encryption.js';

function mapAIError(err, context) {
  const clientMessage = err.status === 401 || err.status === 403
    ? 'Invalid API key. Please check your OpenRouter API key.'
    : err.status === 429
      ? 'Rate limit exceeded. Please wait a moment and try again.'
      : `An error occurred while ${context}. Please try again or use a different model.`;
  return { status: err.status || 500, message: clientMessage };
}

const router = Router();

const allowedModelIds = new Set(availableModels.map(m => m.id));

function validateAIInput({ prompt, model, projectId, existingNodes, existingEdges }) {
  if (prompt !== undefined) {
    if (typeof prompt !== 'string') return 'prompt must be a string';
    if (prompt.length > 20000) return 'prompt must be at most 20,000 characters';
  }
  if (model !== undefined) {
    if (typeof model !== 'string' || !allowedModelIds.has(model)) {
      return `model must be one of: ${[...allowedModelIds].join(', ')}`;
    }
  }
  if (existingNodes !== undefined) {
    if (!Array.isArray(existingNodes)) return 'existingNodes must be an array';
    if (existingNodes.length > 500) return 'existingNodes must have at most 500 items';
  }
  if (existingEdges !== undefined) {
    if (!Array.isArray(existingEdges)) return 'existingEdges must be an array';
    if (existingEdges.length > 1000) return 'existingEdges must have at most 1,000 items';
  }
  if (projectId !== undefined) {
    if (typeof projectId !== 'string') return 'projectId must be a string';
    if (projectId.length > 100) return 'projectId must be at most 100 characters';
  }
  return null;
}

function getUserApiKey(userId) {
  const row = getUserById(userId);
  if (!row?.openrouter_api_key) return null;
  return decrypt(row.openrouter_api_key);
}

function verifyProjectAccess(userId, projectId) {
  const project = getProjectById(projectId);
  if (!project) return false;
  if (project.owner_id === userId) return true;
  const share = getProjectShare(projectId, userId);
  return share && (share.role === 'editor' || share.role === 'owner');
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

// List available models
router.get('/models', (req, res) => {
  res.json(availableModels);
});

// Generate stories from prompt (or edit existing map)
router.post('/generate', async (req, res) => {
  try {
    const apiKey = getUserApiKey(req.user.id);
    if (!apiKey) return res.status(403).json({ error: 'No API key configured. Add your OpenRouter API key on the projects page.' });

    const { prompt, model, projectId, existingNodes, existingEdges } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    if (!model) return res.status(400).json({ error: 'Model is required' });

    const validationError = validateAIInput({ prompt, model, projectId, existingNodes, existingEdges });
    if (validationError) return res.status(400).json({ error: validationError });

    if (projectId && !verifyProjectAccess(req.user.id, projectId)) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const isEditMode = Array.isArray(existingNodes) && existingNodes.length > 0;

    let messages;
    let result;
    if (isEditMode) {
      const compactState = buildCompactState(existingNodes, existingEdges || []);
      messages = [
        { role: 'system', content: EDIT_SYSTEM_PROMPT },
        { role: 'user', content: `${compactState}\n\nUSER REQUEST: ${prompt}` },
      ];
      result = await chatCompletion(apiKey, model, messages, { temperature: 0.4 });
    } else {
      messages = [
        { role: 'system', content: GENERATE_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ];
      result = await chatCompletion(apiKey, model, messages);
    }

    // Shape validation — retry once with correction if wrong structure
    if (isEditMode && !Array.isArray(result.operations)) {
      console.warn('AI returned wrong shape (missing operations), retrying with correction...');
      const correctionMessages = [
        ...messages,
        { role: 'assistant', content: JSON.stringify(result) },
        { role: 'user', content: 'Your response must be a JSON object with an "operations" array. Example: { "operations": [{ "type": "add_node", ... }] }' },
      ];
      result = await chatCompletion(apiKey, model, correctionMessages, { temperature: 0.4 });
    } else if (!isEditMode && !Array.isArray(result.nodes)) {
      console.warn('AI returned wrong shape (missing nodes), retrying with correction...');
      const correctionMessages = [
        ...messages,
        { role: 'assistant', content: JSON.stringify(result) },
        { role: 'user', content: 'Your response must be a JSON object with a "nodes" array and an "edges" array. Example: { "nodes": [...], "edges": [...] }' },
      ];
      result = await chatCompletion(apiKey, model, correctionMessages);
    }

    // Save to history
    if (projectId) {
      db.prepare(
        'INSERT INTO ai_history (id, project_id, prompt, response, model) VALUES (?, ?, ?, ?, ?)'
      ).run(uuidv4(), projectId, prompt, JSON.stringify(result), model);
    }

    if (isEditMode) {
      const ops = result.operations;
      if (!Array.isArray(ops)) {
        return res.status(422).json({ error: 'AI returned an unexpected format. Try rephrasing your request or using a different model.' });
      }
      res.json({ mode: 'edit', operations: ops });
    } else {
      if (!Array.isArray(result.nodes)) {
        return res.status(422).json({ error: 'AI returned an unexpected format. Try rephrasing your request or using a different model.' });
      }
      res.json({ mode: 'generate', nodes: result.nodes, edges: result.edges || [] });
    }
  } catch (err) {
    console.error('AI generate error:', err);
    const { status, message } = mapAIError(err, 'generating');
    res.status(status).json({ error: message });
  }
});

// Rearrange existing nodes
router.post('/arrange', async (req, res) => {
  try {
    const apiKey = getUserApiKey(req.user.id);
    if (!apiKey) return res.status(403).json({ error: 'No API key configured. Add your OpenRouter API key on the projects page.' });

    const { nodes, edges, model } = req.body;
    if (!nodes) return res.status(400).json({ error: 'Nodes are required' });
    if (!model) return res.status(400).json({ error: 'Model is required' });

    const validationError = validateAIInput({ model, existingNodes: nodes, existingEdges: edges });
    if (validationError) return res.status(400).json({ error: validationError });

    const result = await chatCompletion(apiKey, model, [
      { role: 'system', content: ARRANGE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Rearrange these nodes:\n\nNodes: ${JSON.stringify(nodes)}\n\nEdges: ${JSON.stringify(edges || [])}`,
      },
    ]);

    res.json(result);
  } catch (err) {
    console.error('AI arrange error:', err);
    const { status, message } = mapAIError(err, 'arranging');
    res.status(status).json({ error: message });
  }
});

// AI interaction history
router.get('/history/:projectId', requireProjectAccess('viewer'), (req, res) => {
  const history = db.prepare(
    'SELECT * FROM ai_history WHERE project_id = ? ORDER BY created_at DESC'
  ).all(req.params.projectId);
  res.json(history);
});

export default router;
