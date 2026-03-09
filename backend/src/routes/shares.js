import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../db/database.js';
import { isValidRole } from '../db/queries.js';
import { requireProjectAccess } from '../middleware/auth.js';

const router = Router();

// List shares for a project (owner only)
router.get('/:projectId/shares', requireProjectAccess('owner'), (req, res) => {
  const shares = db.prepare(`
    SELECT ps.*, u.name as user_name
    FROM project_shares ps
    LEFT JOIN users u ON u.id = ps.user_id
    WHERE ps.project_id = ?
    ORDER BY ps.created_at DESC
  `).all(req.params.projectId);
  res.json(shares);
});

// Add share by email (owner only)
router.post('/:projectId/shares', requireProjectAccess('owner'), (req, res) => {
  const { email, role = 'viewer' } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (!isValidRole(role)) {
    return res.status(400).json({ error: 'Role must be viewer or editor' });
  }

  const projectId = req.params.projectId;

  // Check if already shared with this email
  const existing = db.prepare(
    'SELECT * FROM project_shares WHERE project_id = ? AND invited_email = ? AND share_token IS NULL'
  ).get(projectId, email);
  if (existing) {
    return res.status(409).json({ error: 'Already shared with this email' });
  }

  // Check if the user exists
  const user = db.prepare('SELECT id, name FROM users WHERE email = ?').get(email);

  const id = uuidv4();
  db.prepare(
    'INSERT INTO project_shares (id, project_id, user_id, invited_email, role) VALUES (?, ?, ?, ?, ?)'
  ).run(id, projectId, user?.id || null, email, role);

  const share = db.prepare(`
    SELECT ps.*, u.name as user_name
    FROM project_shares ps
    LEFT JOIN users u ON u.id = ps.user_id
    WHERE ps.id = ?
  `).get(id);
  res.status(201).json(share);
});

// Update share role (owner only)
router.patch('/:projectId/shares/:shareId', requireProjectAccess('owner'), (req, res) => {
  const { role } = req.body;
  if (!isValidRole(role)) {
    return res.status(400).json({ error: 'Role must be viewer or editor' });
  }

  const share = db.prepare(
    'SELECT * FROM project_shares WHERE id = ? AND project_id = ?'
  ).get(req.params.shareId, req.params.projectId);
  if (!share) return res.status(404).json({ error: 'Share not found' });

  db.prepare('UPDATE project_shares SET role = ? WHERE id = ?').run(role, req.params.shareId);

  const updated = db.prepare(`
    SELECT ps.*, u.name as user_name
    FROM project_shares ps
    LEFT JOIN users u ON u.id = ps.user_id
    WHERE ps.id = ?
  `).get(req.params.shareId);
  res.json(updated);
});

// Remove share (owner only)
router.delete('/:projectId/shares/:shareId', requireProjectAccess('owner'), (req, res) => {
  const share = db.prepare(
    'SELECT * FROM project_shares WHERE id = ? AND project_id = ?'
  ).get(req.params.shareId, req.params.projectId);
  if (!share) return res.status(404).json({ error: 'Share not found' });

  db.prepare('DELETE FROM project_shares WHERE id = ?').run(req.params.shareId);
  res.status(204).end();
});

// Generate shareable link (owner only)
router.post('/:projectId/shares/link', requireProjectAccess('owner'), (req, res) => {
  const { role = 'viewer' } = req.body;
  if (!isValidRole(role)) {
    return res.status(400).json({ error: 'Role must be viewer or editor' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const id = uuidv4();

  // Share links expire after 30 days by default
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO project_shares (id, project_id, invited_email, role, share_token, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.params.projectId, 'link-share', role, token, expiresAt);

  const baseUrl = req.headers.origin || `${req.protocol}://${req.get('host')}`;
  res.json({ token, url: `${baseUrl}/share/${token}`, expiresAt });
});

// Accept a shareable link (authenticated user)
router.post('/accept/:token', (req, res) => {
  const share = db.prepare(
    'SELECT * FROM project_shares WHERE share_token = ?'
  ).get(req.params.token);

  if (!share) return res.status(404).json({ error: 'Invalid or expired share link' });

  // Check if the share link has expired
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return res.status(410).json({ error: 'This share link has expired' });
  }

  // Create a personal share entry for this user
  const userId = req.user.id;
  const userEmail = req.user.email;

  // Check if user already has access
  const existing = db.prepare(
    'SELECT * FROM project_shares WHERE project_id = ? AND user_id = ? AND share_token IS NULL'
  ).get(share.project_id, userId);

  if (!existing) {
    const id = uuidv4();
    db.prepare(
      'INSERT INTO project_shares (id, project_id, user_id, invited_email, role) VALUES (?, ?, ?, ?, ?)'
    ).run(id, share.project_id, userId, userEmail, share.role);
  }

  // Check ownership
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(share.project_id);
  if (project && project.owner_id === userId) {
    // User is already the owner
  }

  res.json({ projectId: share.project_id });
});

export default router;
