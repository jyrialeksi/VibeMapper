import db from './database.js';

/**
 * Reusable database query helpers to eliminate duplication across routes.
 */

export function getCanvasState(projectId) {
  return db.prepare('SELECT * FROM canvas_states WHERE project_id = ?').get(projectId);
}

export function getProjectById(projectId) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
}

export function getUserById(userId) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

export function getProjectShare(projectId, userId) {
  return db.prepare(
    'SELECT * FROM project_shares WHERE project_id = ? AND user_id = ? AND share_token IS NULL'
  ).get(projectId, userId);
}

export function isValidRole(role) {
  return ['viewer', 'editor'].includes(role);
}
