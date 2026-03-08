import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import express from 'express';
import request from 'supertest';

function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      owner_id TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS canvas_states (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL UNIQUE,
      nodes TEXT DEFAULT '[]',
      edges TEXT DEFAULT '[]',
      viewport TEXT DEFAULT '{"x":0,"y":0,"zoom":1}',
      show_descriptions INTEGER DEFAULT 1,
      show_acceptance_criteria INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS canvas_versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      label TEXT DEFAULT 'Auto-save',
      nodes TEXT NOT NULL DEFAULT '[]',
      edges TEXT NOT NULL DEFAULT '[]',
      viewport TEXT NOT NULL DEFAULT '{"x":0,"y":0,"zoom":1}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_canvas_versions_project
      ON canvas_versions(project_id, version_number DESC);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      picture TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_shares (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT,
      invited_email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      share_token TEXT UNIQUE,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  db.prepare("INSERT INTO projects (id, name, description) VALUES ('proj-1', 'Test Project', '')").run();
  db.prepare("INSERT INTO canvas_states (id, project_id, nodes, edges, viewport) VALUES ('cs-1', 'proj-1', '[]', '[]', '{\"x\":0,\"y\":0,\"zoom\":1}')").run();

  return db;
}

/** Middleware that injects a fake user (simulates requireAuth in dev mode) */
function fakeAuth(req, _res, next) {
  req.user = { id: 'test-user', email: 'test@test.com', name: 'Test User' };
  next();
}

describe('Canvas API endpoints', () => {
  let app;

  beforeEach(async () => {
    const db = createTestDb();

    vi.resetModules();
    vi.doMock('../db/database.js', () => ({ default: db }));

    const canvasModule = await import('../routes/canvas.js');

    app = express();
    app.use(express.json());
    app.use(fakeAuth);
    app.use('/api/canvas', canvasModule.default);
  });

  it('PUT /:projectId creates a version on save', async () => {
    const res = await request(app)
      .put('/api/canvas/proj-1')
      .send({
        nodes: [{ id: 'n1' }],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.version).toBeDefined();
    expect(res.body.version.version_number).toBe(1);
    expect(res.body.version.label).toBe('Auto-save');
  });

  it('PUT /:projectId with label stores custom label', async () => {
    const res = await request(app)
      .put('/api/canvas/proj-1')
      .send({
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        label: 'Before refactor',
      });

    expect(res.status).toBe(200);
    expect(res.body.version.label).toBe('Before refactor');
  });

  it('PUT /:projectId returns 404 for nonexistent project', async () => {
    const res = await request(app)
      .put('/api/canvas/nonexistent')
      .send({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });

    expect(res.status).toBe(404);
  });

  it('GET /:projectId/versions returns version list', async () => {
    await request(app).put('/api/canvas/proj-1').send({
      nodes: [{ id: 'n1' }], edges: [], viewport: { x: 0, y: 0, zoom: 1 },
    });
    await request(app).put('/api/canvas/proj-1').send({
      nodes: [{ id: 'n2' }], edges: [], viewport: { x: 0, y: 0, zoom: 1 },
    });

    const res = await request(app).get('/api/canvas/proj-1/versions');
    expect(res.status).toBe(200);
    expect(res.body.versions).toHaveLength(2);
    expect(res.body.versions[0].version_number).toBe(2);
    expect(res.body.versions[1].version_number).toBe(1);
  });

  it('GET /:projectId/versions supports pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).put('/api/canvas/proj-1').send({
        nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 },
      });
    }

    const res = await request(app).get('/api/canvas/proj-1/versions?limit=2&offset=0');
    expect(res.body.versions).toHaveLength(2);
    expect(res.body.versions[0].version_number).toBe(5);
  });

  it('GET /:projectId/versions/:versionId returns version detail', async () => {
    const putRes = await request(app).put('/api/canvas/proj-1').send({
      nodes: [{ id: 'n1', type: 'storyCard' }],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
      viewport: { x: 10, y: 20, zoom: 2 },
    });

    const versionId = putRes.body.version.id;
    const res = await request(app).get(`/api/canvas/proj-1/versions/${versionId}`);

    expect(res.status).toBe(200);
    expect(res.body.version_number).toBe(1);
    expect(res.body.nodes).toEqual([{ id: 'n1', type: 'storyCard' }]);
    expect(res.body.edges).toEqual([{ id: 'e1', source: 'n1', target: 'n2' }]);
    expect(res.body.viewport).toEqual({ x: 10, y: 20, zoom: 2 });
  });

  it('GET /:projectId/versions/:versionId returns 404 for nonexistent', async () => {
    const res = await request(app).get('/api/canvas/proj-1/versions/nonexistent');
    expect(res.status).toBe(404);
  });

  it('POST /:projectId/versions/:versionId/restore restores and creates new version', async () => {
    const putRes = await request(app).put('/api/canvas/proj-1').send({
      nodes: [{ id: 'original' }],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    });
    const versionId = putRes.body.version.id;

    await request(app).put('/api/canvas/proj-1').send({
      nodes: [{ id: 'modified' }],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    });

    const res = await request(app).post(`/api/canvas/proj-1/versions/${versionId}/restore`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.nodes).toEqual([{ id: 'original' }]);
    expect(res.body.version.label).toContain('Restored');
    expect(res.body.version.version_number).toBe(3);
  });

  it('POST /:projectId/versions/:versionId/restore returns 404 for nonexistent', async () => {
    const res = await request(app).post('/api/canvas/proj-1/versions/nonexistent/restore');
    expect(res.status).toBe(404);
  });

  it('POST /:projectId/versions creates named snapshot', async () => {
    await request(app).put('/api/canvas/proj-1').send({
      nodes: [{ id: 'n1' }],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    });

    const res = await request(app)
      .post('/api/canvas/proj-1/versions')
      .send({ label: 'Release v1.0' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.version.label).toBe('Release v1.0');
    expect(res.body.version.version_number).toBe(2);
  });

  it('POST /:projectId/versions requires label', async () => {
    const res = await request(app)
      .post('/api/canvas/proj-1/versions')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Label is required');
  });

  it('POST /:projectId/versions returns 404 for nonexistent project', async () => {
    const res = await request(app)
      .post('/api/canvas/nonexistent/versions')
      .send({ label: 'test' });

    expect(res.status).toBe(404);
  });
});
