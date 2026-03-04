import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';

const router = Router();

// List all projects
router.get('/', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
  res.json(projects);
});

// Create project
router.post('/', (req, res) => {
  const { name, description = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const id = uuidv4();
  const canvasId = uuidv4();

  const insertProject = db.prepare(
    'INSERT INTO projects (id, name, description) VALUES (?, ?, ?)'
  );
  const insertCanvas = db.prepare(
    'INSERT INTO canvas_states (id, project_id) VALUES (?, ?)'
  );

  const transaction = db.transaction(() => {
    insertProject.run(id, name, description);
    insertCanvas.run(canvasId, id);
  });

  transaction();

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json(project);
});

// Get single project
router.get('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// Update project
router.patch('/:id', (req, res) => {
  const { name, description } = req.body;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  db.prepare(
    "UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), updated_at = datetime('now') WHERE id = ?"
  ).run(name ?? null, description ?? null, req.params.id);

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete project (cascade deletes canvas_states and ai_history)
router.delete('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
