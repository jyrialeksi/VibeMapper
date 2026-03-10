import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createTestDb, fakeAuth, seedProject, seedUser, seedComment } from './helpers.js';

describe('Comments API', () => {
  let app;
  let db;

  beforeEach(async () => {
    db = createTestDb();
    seedUser(db);
    seedProject(db);

    vi.resetModules();
    vi.doMock('../db/database.js', () => ({ default: db }));
    vi.doMock('../sse/connections.js', () => ({
      broadcast: vi.fn(),
      addClient: vi.fn(),
    }));

    const commentsModule = await import('../routes/comments.js');
    app = express();
    app.use(express.json());
    app.use(fakeAuth());
    app.use('/api/projects', commentsModule.default);
  });

  it('GET /comments returns empty array for node with no comments', async () => {
    const res = await request(app).get('/api/projects/proj-1/nodes/story-1/comments');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /comments returns comments with user_name and user_picture', async () => {
    seedComment(db, 'proj-1', 'story-1', 'test-user', 'Hello world', 'c1');

    const res = await request(app).get('/api/projects/proj-1/nodes/story-1/comments');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].content).toBe('Hello world');
    expect(res.body[0].user_name).toBe('Test User');
    expect(res.body[0].user_picture).toBeDefined();
  });

  it('POST /comments creates comment and returns it with user info', async () => {
    const res = await request(app)
      .post('/api/projects/proj-1/nodes/story-1/comments')
      .send({ content: 'New comment' });

    expect(res.status).toBe(201);
    expect(res.body.content).toBe('New comment');
    expect(res.body.user_name).toBe('Test User');
    expect(res.body.node_id).toBe('story-1');
    expect(res.body.project_id).toBe('proj-1');
    expect(res.body.id).toBeDefined();
  });

  it('POST /comments validates content (non-empty)', async () => {
    const res = await request(app)
      .post('/api/projects/proj-1/nodes/story-1/comments')
      .send({ content: '' });
    expect(res.status).toBe(400);

    const res2 = await request(app)
      .post('/api/projects/proj-1/nodes/story-1/comments')
      .send({ content: '   ' });
    expect(res2.status).toBe(400);

    const res3 = await request(app)
      .post('/api/projects/proj-1/nodes/story-1/comments')
      .send({});
    expect(res3.status).toBe(400);
  });

  it('POST /comments validates content (max 5000 chars)', async () => {
    const res = await request(app)
      .post('/api/projects/proj-1/nodes/story-1/comments')
      .send({ content: 'x'.repeat(5001) });
    expect(res.status).toBe(400);
  });

  it('POST /comments viewer can add comment', async () => {
    // Create a second user who is a viewer
    seedUser(db, 'viewer-user', 'viewer@test.com', 'Viewer');
    db.prepare(
      "INSERT INTO project_shares (id, project_id, user_id, invited_email, role) VALUES ('s1', 'proj-1', 'viewer-user', 'viewer@test.com', 'viewer')"
    ).run();

    const viewerApp = express();
    viewerApp.use(express.json());
    viewerApp.use(fakeAuth('viewer-user', 'viewer@test.com'));

    const commentsModule = await import('../routes/comments.js');
    viewerApp.use('/api/projects', commentsModule.default);

    const res = await request(viewerApp)
      .post('/api/projects/proj-1/nodes/story-1/comments')
      .send({ content: 'Viewer comment' });
    expect(res.status).toBe(201);
    expect(res.body.content).toBe('Viewer comment');
  });

  it('DELETE /comments/:id owner of comment can delete', async () => {
    const createRes = await request(app)
      .post('/api/projects/proj-1/nodes/story-1/comments')
      .send({ content: 'To delete' });
    const commentId = createRes.body.id;

    const res = await request(app).delete(`/api/projects/proj-1/comments/${commentId}`);
    expect(res.status).toBe(204);

    // Verify it's gone
    const listRes = await request(app).get('/api/projects/proj-1/nodes/story-1/comments');
    expect(listRes.body).toHaveLength(0);
  });

  it('DELETE /comments/:id project owner can delete any comment', async () => {
    // Create another user's comment
    seedUser(db, 'other-user', 'other@test.com', 'Other');
    seedComment(db, 'proj-1', 'story-1', 'other-user', 'Other comment', 'c-other');

    // test-user is the project owner, should be able to delete
    const res = await request(app).delete('/api/projects/proj-1/comments/c-other');
    expect(res.status).toBe(204);
  });

  it('DELETE /comments/:id other user cannot delete (403)', async () => {
    // Create a comment by project owner
    seedComment(db, 'proj-1', 'story-1', 'test-user', 'Owner comment', 'c-owner');

    // Another user who is a viewer
    seedUser(db, 'viewer-user', 'viewer@test.com', 'Viewer');
    db.prepare(
      "INSERT INTO project_shares (id, project_id, user_id, invited_email, role) VALUES ('s1', 'proj-1', 'viewer-user', 'viewer@test.com', 'viewer')"
    ).run();

    const viewerApp = express();
    viewerApp.use(express.json());
    viewerApp.use(fakeAuth('viewer-user', 'viewer@test.com'));
    const commentsModule = await import('../routes/comments.js');
    viewerApp.use('/api/projects', commentsModule.default);

    const res = await request(viewerApp).delete('/api/projects/proj-1/comments/c-owner');
    expect(res.status).toBe(403);
  });

  it('DELETE /comments/:id nonexistent returns 404', async () => {
    const res = await request(app).delete('/api/projects/proj-1/comments/nonexistent');
    expect(res.status).toBe(404);
  });

  it('GET /comment-counts returns correct counts', async () => {
    seedComment(db, 'proj-1', 'story-1', 'test-user', 'Comment 1', 'c1');
    seedComment(db, 'proj-1', 'story-1', 'test-user', 'Comment 2', 'c2');
    seedComment(db, 'proj-1', 'story-2', 'test-user', 'Comment 3', 'c3');

    const res = await request(app).get('/api/projects/proj-1/comment-counts');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ 'story-1': 2, 'story-2': 1 });
  });

  it('GET /comment-counts returns empty object when no comments', async () => {
    const res = await request(app).get('/api/projects/proj-1/comment-counts');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
  });

  it('GET /comment-counts excludes resolved comments', async () => {
    seedComment(db, 'proj-1', 'story-1', 'test-user', 'Comment 1', 'c1');
    seedComment(db, 'proj-1', 'story-1', 'test-user', 'Comment 2', 'c2');
    // Mark c1 as resolved
    db.prepare("UPDATE card_comments SET resolved_at = datetime('now') WHERE id = 'c1'").run();

    const res = await request(app).get('/api/projects/proj-1/comment-counts');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ 'story-1': 1 });
  });

  it('GET /comment-counts excludes system messages', async () => {
    seedComment(db, 'proj-1', 'story-1', 'test-user', 'Comment 1', 'c1');
    db.prepare(
      "INSERT INTO card_comments (id, project_id, node_id, user_id, content, is_system_message) VALUES ('sys1', 'proj-1', 'story-1', 'test-user', 'System msg', 1)"
    ).run();

    const res = await request(app).get('/api/projects/proj-1/comment-counts');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ 'story-1': 1 });
  });

  it('POST /comments/resolve marks comments as resolved and adds system message', async () => {
    seedComment(db, 'proj-1', 'story-1', 'test-user', 'Comment 1', 'c1');
    seedComment(db, 'proj-1', 'story-1', 'test-user', 'Comment 2', 'c2');

    const res = await request(app)
      .post('/api/projects/proj-1/nodes/story-1/comments/resolve');
    expect(res.status).toBe(200);
    expect(res.body.systemComment).toBeDefined();
    expect(res.body.systemComment.is_system_message).toBe(1);
    expect(res.body.systemComment.content).toContain('Comments resolved by');
    expect(res.body.systemComment.content).toContain('Test User');

    // Verify comments are now resolved
    const resolved = db.prepare(
      "SELECT COUNT(*) as count FROM card_comments WHERE project_id = 'proj-1' AND node_id = 'story-1' AND resolved_at IS NOT NULL AND is_system_message = 0"
    ).get();
    expect(resolved.count).toBe(2);

    // Verify comment-counts returns 0 (empty object)
    const countsRes = await request(app).get('/api/projects/proj-1/comment-counts');
    expect(countsRes.body).toEqual({});
  });

  it('POST /comments/resolve returns 400 when no unresolved comments', async () => {
    const res = await request(app)
      .post('/api/projects/proj-1/nodes/story-1/comments/resolve');
    expect(res.status).toBe(400);
  });

  it('POST /comments/resolve does not re-resolve already resolved comments', async () => {
    seedComment(db, 'proj-1', 'story-1', 'test-user', 'Comment 1', 'c1');
    // Resolve first time
    await request(app).post('/api/projects/proj-1/nodes/story-1/comments/resolve');

    // Add new comment
    await request(app)
      .post('/api/projects/proj-1/nodes/story-1/comments')
      .send({ content: 'New after resolve' });

    // Resolve again — should only resolve the new one
    const res = await request(app)
      .post('/api/projects/proj-1/nodes/story-1/comments/resolve');
    expect(res.status).toBe(200);

    // Verify: 2 resolved non-system comments total (c1 + new one)
    const resolved = db.prepare(
      "SELECT COUNT(*) as count FROM card_comments WHERE project_id = 'proj-1' AND node_id = 'story-1' AND resolved_at IS NOT NULL AND is_system_message = 0"
    ).get();
    expect(resolved.count).toBe(2);
  });

  it('POST /comments/resolve requires editor role (viewer gets 403)', async () => {
    seedUser(db, 'viewer-user', 'viewer@test.com', 'Viewer');
    db.prepare(
      "INSERT INTO project_shares (id, project_id, user_id, invited_email, role) VALUES ('s1', 'proj-1', 'viewer-user', 'viewer@test.com', 'viewer')"
    ).run();
    seedComment(db, 'proj-1', 'story-1', 'test-user', 'Comment 1', 'c1');

    const viewerApp = express();
    viewerApp.use(express.json());
    viewerApp.use(fakeAuth('viewer-user', 'viewer@test.com'));
    const commentsModule = await import('../routes/comments.js');
    viewerApp.use('/api/projects', commentsModule.default);

    const res = await request(viewerApp)
      .post('/api/projects/proj-1/nodes/story-1/comments/resolve');
    expect(res.status).toBe(403);
  });

  it('new comments after resolve show up in comment-counts', async () => {
    seedComment(db, 'proj-1', 'story-1', 'test-user', 'Comment 1', 'c1');
    // Resolve
    await request(app).post('/api/projects/proj-1/nodes/story-1/comments/resolve');

    // Add new comment
    await request(app)
      .post('/api/projects/proj-1/nodes/story-1/comments')
      .send({ content: 'New comment' });

    const countsRes = await request(app).get('/api/projects/proj-1/comment-counts');
    expect(countsRes.body).toEqual({ 'story-1': 1 });
  });
});

describe('Comments API - Apply endpoint', () => {
  let app;
  let db;

  beforeEach(async () => {
    db = createTestDb();
    seedUser(db);
    seedProject(db);

    // Set up canvas state with a node
    const nodes = JSON.stringify([
      {
        id: 'story-1',
        type: 'storyCard',
        position: { x: 0, y: 400 },
        data: {
          title: 'Test Story',
          description: 'A test story',
          acceptanceCriteria: ['AC1', 'AC2'],
          cardType: 'storyCard',
          priority: 'must-have',
        },
      },
    ]);
    db.prepare('UPDATE canvas_states SET nodes = ? WHERE project_id = ?').run(nodes, 'proj-1');

    // Give user an API key
    db.prepare("UPDATE users SET openrouter_api_key = 'test-key' WHERE id = 'test-user'").run();

    vi.resetModules();
    vi.doMock('../db/database.js', () => ({ default: db }));
    vi.doMock('../sse/connections.js', () => ({
      broadcast: vi.fn(),
      addClient: vi.fn(),
    }));
    vi.doMock('../ai/client.js', () => ({
      chatCompletion: vi.fn().mockResolvedValue({ operations: [{ type: 'update_node', nodeId: 'story-1', data: { title: 'Updated' } }] }),
    }));
    vi.doMock('../utils/encryption.js', () => ({
      decrypt: (v) => v,
      encrypt: (v) => v,
    }));

    const commentsModule = await import('../routes/comments.js');
    app = express();
    app.use(express.json());
    app.use(fakeAuth());
    app.use('/api/projects', commentsModule.default);
  });

  it('POST /comments/apply requires editor+ role (viewer gets 403)', async () => {
    seedUser(db, 'viewer-user', 'viewer@test.com', 'Viewer');
    db.prepare(
      "INSERT INTO project_shares (id, project_id, user_id, invited_email, role) VALUES ('s1', 'proj-1', 'viewer-user', 'viewer@test.com', 'viewer')"
    ).run();
    seedComment(db, 'proj-1', 'story-1', 'viewer-user', 'Please update this', 'c1');

    const viewerApp = express();
    viewerApp.use(express.json());
    viewerApp.use(fakeAuth('viewer-user', 'viewer@test.com'));
    const commentsModule = await import('../routes/comments.js');
    viewerApp.use('/api/projects', commentsModule.default);

    const res = await request(viewerApp)
      .post('/api/projects/proj-1/nodes/story-1/comments/apply')
      .send({ model: 'test-model' });
    expect(res.status).toBe(403);
  });

  it('POST /comments/apply returns AI operations result', async () => {
    seedComment(db, 'proj-1', 'story-1', 'test-user', 'Please change the title', 'c1');

    const res = await request(app)
      .post('/api/projects/proj-1/nodes/story-1/comments/apply')
      .send({ model: 'test-model' });

    expect(res.status).toBe(200);
    expect(res.body.operations).toBeDefined();
    expect(Array.isArray(res.body.operations)).toBe(true);
    expect(res.body.systemComment).toBeDefined();
    expect(res.body.systemComment.is_system_message).toBe(1);
    expect(res.body.systemComment.content).toBe('Changes from the above discussion have been applied');
  });

  it('POST /comments/apply returns 400 when no comments exist', async () => {
    const res = await request(app)
      .post('/api/projects/proj-1/nodes/story-1/comments/apply')
      .send({ model: 'test-model' });
    expect(res.status).toBe(400);
  });

  it('POST /comments/apply returns 400 when model is missing', async () => {
    seedComment(db, 'proj-1', 'story-1', 'test-user', 'A comment', 'c1');
    const res = await request(app)
      .post('/api/projects/proj-1/nodes/story-1/comments/apply')
      .send({});
    expect(res.status).toBe(400);
  });
});
