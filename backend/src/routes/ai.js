import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { chatCompletion } from '../ai/client.js';
import { availableModels } from '../ai/models.js';
import { GENERATE_SYSTEM_PROMPT, ARRANGE_SYSTEM_PROMPT } from '../ai/prompts.js';

const router = Router();

// List available models
router.get('/models', (req, res) => {
  res.json(availableModels);
});

// Generate stories from prompt
router.post('/generate', async (req, res) => {
  try {
    const { prompt, model, projectId } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    if (!model) return res.status(400).json({ error: 'Model is required' });

    const result = await chatCompletion(model, [
      { role: 'system', content: GENERATE_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ]);

    // Save to history
    if (projectId) {
      db.prepare(
        'INSERT INTO ai_history (id, project_id, prompt, response, model) VALUES (?, ?, ?, ?, ?)'
      ).run(uuidv4(), projectId, prompt, JSON.stringify(result), model);
    }

    res.json(result);
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
