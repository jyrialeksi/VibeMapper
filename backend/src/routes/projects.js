import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { requireProjectAccess } from '../middleware/auth.js';

const router = Router();

// List projects (owned + shared with me)
router.get('/', (req, res) => {
  const userId = req.user.id;
  const projects = db.prepare(`
    SELECT DISTINCT p.*,
      CASE WHEN p.owner_id = ? THEN 'owner' ELSE COALESCE(ps.role, 'owner') END as role,
      CASE WHEN p.owner_id = ? THEN NULL ELSE u.name END as owner_name
    FROM projects p
    LEFT JOIN project_shares ps ON ps.project_id = p.id AND ps.user_id = ?
    LEFT JOIN users u ON u.id = p.owner_id
    WHERE p.owner_id = ? OR p.owner_id IS NULL OR ps.user_id IS NOT NULL
    ORDER BY p.updated_at DESC
  `).all(userId, userId, userId, userId);
  res.json(projects);
});

// Create project
router.post('/', (req, res) => {
  const { name, description = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const id = uuidv4();
  const canvasId = uuidv4();
  const userId = req.user.id;

  const insertProject = db.prepare(
    'INSERT INTO projects (id, name, description, owner_id) VALUES (?, ?, ?, ?)'
  );
  const insertCanvas = db.prepare(
    'INSERT INTO canvas_states (id, project_id) VALUES (?, ?)'
  );

  const transaction = db.transaction(() => {
    insertProject.run(id, name, description, userId);
    insertCanvas.run(canvasId, id);
  });

  transaction();

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json({ ...project, role: 'owner' });
});

// Get single project
router.get('/:id', requireProjectAccess('viewer'), (req, res) => {
  res.json({ ...req.project, role: req.projectRole });
});

// Update project
router.patch('/:id', requireProjectAccess('editor'), (req, res) => {
  const { name, description } = req.body;

  db.prepare(
    "UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), updated_at = datetime('now') WHERE id = ?"
  ).run(name ?? null, description ?? null, req.params.id);

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Delete project (owner only)
router.delete('/:id', requireProjectAccess('owner'), (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
