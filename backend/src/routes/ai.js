import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { chatCompletion } from '../ai/client.js';
import { availableModels } from '../ai/models.js';
import { GENERATE_SYSTEM_PROMPT, EDIT_SYSTEM_PROMPT, ARRANGE_SYSTEM_PROMPT } from '../ai/prompts.js';

const router = Router();

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
    const { prompt, model, projectId, existingNodes, existingEdges } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    if (!model) return res.status(400).json({ error: 'Model is required' });

    const isEditMode = Array.isArray(existingNodes) && existingNodes.length > 0;

    let result;
    if (isEditMode) {
      const compactState = buildCompactState(existingNodes, existingEdges || []);
      result = await chatCompletion(model, [
        { role: 'system', content: EDIT_SYSTEM_PROMPT },
        { role: 'user', content: `${compactState}\n\nUSER REQUEST: ${prompt}` },
      ], { temperature: 0.4 });
    } else {
      result = await chatCompletion(model, [
        { role: 'system', content: GENERATE_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ]);
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
        return res.status(502).json({ error: 'AI returned an unexpected format. Try rephrasing your request or using a different model.' });
      }
      res.json({ mode: 'edit', operations: ops });
    } else {
      if (!Array.isArray(result.nodes)) {
        return res.status(502).json({ error: 'AI returned an unexpected format. Try rephrasing your request or using a different model.' });
      }
      res.json({ mode: 'generate', nodes: result.nodes, edges: result.edges || [] });
    }
  } catch (err) {
    console.error('AI generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Rearrange existing nodes
router.post('/arrange', async (req, res) => {
  try {
    const { nodes, edges, model } = req.body;
    if (!nodes) return res.status(400).json({ error: 'Nodes are required' });
    if (!model) return res.status(400).json({ error: 'Model is required' });

    const result = await chatCompletion(model, [
      { role: 'system', content: ARRANGE_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Rearrange these nodes:\n\nNodes: ${JSON.stringify(nodes)}\n\nEdges: ${JSON.stringify(edges || [])}`,
      },
    ]);

    res.json(result);
  } catch (err) {
    console.error('AI arrange error:', err);
    res.status(500).json({ error: err.message });
  }
});

// AI interaction history
router.get('/history/:projectId', (req, res) => {
  const history = db.prepare(
    'SELECT * FROM ai_history WHERE project_id = ? ORDER BY created_at DESC'
  ).all(req.params.projectId);
  res.json(history);
});

export default router;
