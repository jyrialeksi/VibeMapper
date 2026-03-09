import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createTestDb, fakeAuth, seedProject, seedUser } from './helpers.js';

describe('Projects API', () => {
  let app;

  beforeEach(async () => {
    const db = createTestDb();
    seedUser(db);
    seedProject(db);

    vi.resetModules();
    vi.doMock('../db/database.js', () => ({ default: db }));

    const projectsModule = await import('../routes/projects.js');

    app = express();
    app.use(express.json());
    app.use(fakeAuth());
    app.use('/api/projects', projectsModule.default);
  });

  it('GET / returns projects owned by user', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].name).toBe('Test Project');
  });

  it('POST / creates project with owner_id', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'New Project', description: 'A desc' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New Project');
    expect(res.body.owner_id).toBe('test-user');
    expect(res.body.role).toBe('owner');
  });

  it('POST / returns 400 on missing name', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Name');
  });

  it('GET /:id returns project with role', async () => {
    const res = await request(app).get('/api/projects/proj-1');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Project');
    expect(res.body.role).toBe('owner');
  });

  it('GET /:id returns 404 for nonexistent', async () => {
    const res = await request(app).get('/api/projects/nonexistent');
    expect(res.status).toBe(404);
  });

  it('PATCH /:id updates name', async () => {
    const res = await request(app)
      .patch('/api/projects/proj-1')
      .send({ name: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });

  it('DELETE /:id removes project', async () => {
    const res = await request(app).delete('/api/projects/proj-1');
    expect(res.status).toBe(204);

    const getRes = await request(app).get('/api/projects/proj-1');
    expect(getRes.status).toBe(404);
  });

  it('DELETE /:id cascades to canvas_states', async () => {
    const res = await request(app).delete('/api/projects/proj-1');
    expect(res.status).toBe(204);
  });

  it('returns shared projects for user', async () => {
    // Create another project owned by someone else
    const db = (await import('../db/database.js')).default;
    seedUser(db, 'other-user', 'other@test.com', 'Other');
    seedProject(db, 'proj-2', 'Shared Project', 'other-user');
    // Create share entry for test-user
    db.prepare("INSERT INTO project_shares (id, project_id, user_id, invited_email, role) VALUES ('share-1', 'proj-2', 'test-user', 'test@test.com', 'editor')").run();

    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    const names = res.body.map(p => p.name);
    expect(names).toContain('Shared Project');
  });

  it('viewer is blocked from PATCH (403)', async () => {
    const db = (await import('../db/database.js')).default;
    seedUser(db, 'other-user', 'other@test.com', 'Other');
    seedProject(db, 'proj-2', 'Other Project', 'other-user');
    // Share with test-user as viewer
    db.prepare("INSERT INTO project_shares (id, project_id, user_id, invited_email, role) VALUES ('share-v', 'proj-2', 'test-user', 'test@test.com', 'viewer')").run();

    const res = await request(app)
      .patch('/api/projects/proj-2')
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });
});
