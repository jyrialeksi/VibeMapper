import crypto from 'crypto';
import db from './database.js';

const MAX_VERSIONS_PER_PROJECT = 100;

/**
 * Create a new version snapshot for a project.
 * Auto-increments version_number per project and prunes old versions beyond MAX_VERSIONS_PER_PROJECT.
 */
export function createVersion(projectId, nodes, edges, viewport, label = 'Auto-save') {
  const id = crypto.randomUUID();

  // Get the next version number for this project
  const lastVersion = db.prepare(
    'SELECT MAX(version_number) as max_num FROM canvas_versions WHERE project_id = ?'
  ).get(projectId);
  const versionNumber = (lastVersion?.max_num || 0) + 1;

  db.prepare(
    `INSERT INTO canvas_versions (id, project_id, version_number, label, nodes, edges, viewport)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    projectId,
    versionNumber,
    label,
    JSON.stringify(nodes),
    JSON.stringify(edges),
    JSON.stringify(viewport)
  );

  // Prune old versions beyond the limit
  db.prepare(
    `DELETE FROM canvas_versions
     WHERE project_id = ? AND id NOT IN (
       SELECT id FROM canvas_versions
       WHERE project_id = ?
       ORDER BY version_number DESC
       LIMIT ?
     )`
  ).run(projectId, projectId, MAX_VERSIONS_PER_PROJECT);

  return { id, version_number: versionNumber, label };
}

/**
 * List versions for a project, newest first.
 */
export function listVersions(projectId, limit = 50, offset = 0) {
  return db.prepare(
    `SELECT id, version_number, label, created_at
     FROM canvas_versions
     WHERE project_id = ?
     ORDER BY version_number DESC
     LIMIT ? OFFSET ?`
  ).all(projectId, limit, offset);
}

/**
 * Get a single version with full data (nodes/edges/viewport parsed).
 */
export function getVersion(projectId, versionId) {
  return db.prepare(
    'SELECT * FROM canvas_versions WHERE project_id = ? AND id = ?'
  ).get(projectId, versionId);
}
