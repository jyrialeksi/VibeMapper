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

    CREATE TABLE IF NOT EXISTS card_comments (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      node_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_system_message INTEGER DEFAULT 0,
      resolved_at TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_card_comments_project_node
      ON card_comments(project_id, node_id, created_at ASC);
  `);

  db.prepare("INSERT INTO projects (id, name, description) VALUES ('proj-1', 'Test Project', '')").run();
  db.prepare("INSERT INTO canvas_states (id, project_id, nodes, edges, viewport) VALUES ('cs-1', 'proj-1', '[]', '[]', '{\"x\":0,\"y\":0,\"zoom\":1}')").run();
  db.prepare("INSERT INTO users (id, email, name) VALUES ('test-user', 'test@test.com', 'Test User')").run();

  return db;
}

/** Middleware that injects a fake user (simulates requireAuth in dev mode) */
function fakeAuth(req, _res, next) {
  req.user = { id: 'test-user', email: 'test@test.com', name: 'Test User' };
  next();
}

describe('Canvas API endpoints', () => {
  let app;
  let db;

  beforeEach(async () => {
    db = createTestDb();

    vi.resetModules();
    vi.doMock('../db/database.js', () => ({ default: db }));
    vi.doMock('../sse/connections.js', () => ({
      addClient: vi.fn(),
      broadcast: vi.fn(),
    }));

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

  // --- SSE broadcast tests ---

  it('PUT /:projectId broadcasts canvas_update for MCP saves (no excludeUserId)', async () => {
    const { broadcast } = await import('../sse/connections.js');

    await request(app)
      .put('/api/canvas/proj-1')
      .set('X-Source', 'mcp')
      .send({
        nodes: [{ id: 'n1' }],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      });

    expect(broadcast).toHaveBeenCalledWith('proj-1', 'canvas_update', { reason: 'external_update' }, undefined);
  });

  it('PUT /:projectId broadcasts canvas_update with excludeUserId for normal saves', async () => {
    const { broadcast } = await import('../sse/connections.js');

    await request(app)
      .put('/api/canvas/proj-1')
      .send({
        nodes: [{ id: 'n1' }],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      });

    expect(broadcast).toHaveBeenCalledWith('proj-1', 'canvas_update', { reason: 'external_update' }, 'test-user');
  });

  it('PUT /:projectId does not broadcast for non-existent project', async () => {
    const { broadcast } = await import('../sse/connections.js');

    await request(app)
      .put('/api/canvas/nonexistent')
      .send({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });

    expect(broadcast).not.toHaveBeenCalled();
  });

  // --- Input validation tests ---

  it('PUT /:projectId rejects non-array nodes', async () => {
    const res = await request(app)
      .put('/api/canvas/proj-1')
      .send({ nodes: 'not-an-array', edges: [], viewport: { x: 0, y: 0, zoom: 1 } });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid canvas data');
    expect(res.body.details).toContain('nodes must be an array');
  });

  it('PUT /:projectId rejects non-array edges', async () => {
    const res = await request(app)
      .put('/api/canvas/proj-1')
      .send({ nodes: [], edges: 'bad', viewport: { x: 0, y: 0, zoom: 1 } });

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('edges must be an array');
  });

  it('PUT /:projectId rejects invalid viewport', async () => {
    const res = await request(app)
      .put('/api/canvas/proj-1')
      .send({ nodes: [], edges: [], viewport: { x: 'a', y: 0, zoom: 1 } });

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('viewport must have numeric x, y, and zoom');
  });

  it('PUT /:projectId rejects missing viewport', async () => {
    const res = await request(app)
      .put('/api/canvas/proj-1')
      .send({ nodes: [], edges: [], viewport: null });

    expect(res.status).toBe(400);
    expect(res.body.details).toContain('viewport must be an object');
  });

  it('PUT /:projectId rejects node with invalid type', async () => {
    const res = await request(app)
      .put('/api/canvas/proj-1')
      .send({
        nodes: [{ id: 'n1', type: 'malicious' }],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      });

    expect(res.status).toBe(400);
    expect(res.body.details[0]).toContain('not valid');
  });

  it('PUT /:projectId rejects node without id', async () => {
    const res = await request(app)
      .put('/api/canvas/proj-1')
      .send({
        nodes: [{ type: 'storyCard' }],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      });

    expect(res.status).toBe(400);
    expect(res.body.details[0]).toContain('nodes[0].id');
  });

  it('PUT /:projectId rejects edge without source/target', async () => {
    const res = await request(app)
      .put('/api/canvas/proj-1')
      .send({
        nodes: [],
        edges: [{ id: 'e1' }],
        viewport: { x: 0, y: 0, zoom: 1 },
      });

    expect(res.status).toBe(400);
    expect(res.body.details[0]).toContain('source and target');
  });

  it('POST /:projectId/import rejects invalid data', async () => {
    const res = await request(app)
      .post('/api/canvas/proj-1/import')
      .send({ nodes: 'bad', edges: [], viewport: { x: 0, y: 0, zoom: 1 } });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid canvas data');
  });

  it('POST /:projectId/import allows empty body (defaults)', async () => {
    const res = await request(app)
      .post('/api/canvas/proj-1/import')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // --- Export/Import with comments tests ---

  it('GET /:projectId/export includes comments array', async () => {
    db.prepare("INSERT INTO card_comments (id, project_id, node_id, user_id, content) VALUES ('c1', 'proj-1', 'story-1', 'test-user', 'Test comment')").run();

    // Set up nodes so export works
    await request(app).put('/api/canvas/proj-1').send({
      nodes: [{ id: 'story-1', type: 'storyCard' }],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    });

    const res = await request(app).get('/api/canvas/proj-1/export');
    expect(res.status).toBe(200);
    expect(res.body.comments).toBeDefined();
    expect(Array.isArray(res.body.comments)).toBe(true);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.comments[0].node_id).toBe('story-1');
    expect(res.body.comments[0].content).toBe('Test comment');
    expect(res.body.comments[0].user_name).toBe('Test User');
  });

  it('GET /:projectId/export returns empty comments when no comments exist', async () => {
    const res = await request(app).get('/api/canvas/proj-1/export');
    expect(res.status).toBe(200);
    expect(res.body.comments).toBeDefined();
    expect(res.body.comments).toEqual([]);
  });

  it('POST /:projectId/import with comments creates them in DB', async () => {
    const res = await request(app)
      .post('/api/canvas/proj-1/import')
      .send({
        nodes: [{ id: 'story-1', type: 'storyCard' }],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        comments: [
          { node_id: 'story-1', content: 'Imported comment', is_system_message: false, created_at: '2024-01-15T10:00:00Z' },
        ],
      });

    expect(res.status).toBe(200);

    // Verify comment was created
    const comments = db.prepare("SELECT * FROM card_comments WHERE project_id = 'proj-1'").all();
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe('Imported comment');
    expect(comments[0].node_id).toBe('story-1');
  });

  it('POST /:projectId/import skips comments for non-existent node_ids', async () => {
    const res = await request(app)
      .post('/api/canvas/proj-1/import')
      .send({
        nodes: [{ id: 'story-1', type: 'storyCard' }],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        comments: [
          { node_id: 'story-1', content: 'Valid comment' },
          { node_id: 'nonexistent', content: 'Should be skipped' },
        ],
      });

    expect(res.status).toBe(200);
    const comments = db.prepare("SELECT * FROM card_comments WHERE project_id = 'proj-1'").all();
    expect(comments).toHaveLength(1);
    expect(comments[0].node_id).toBe('story-1');
  });

  it('POST /:projectId/import without comments field works (backward compat)', async () => {
    const res = await request(app)
      .post('/api/canvas/proj-1/import')
      .send({
        nodes: [{ id: 'story-1', type: 'storyCard' }],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
