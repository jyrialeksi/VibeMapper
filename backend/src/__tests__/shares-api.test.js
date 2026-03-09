import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createTestDb, fakeAuth, seedProject, seedUser } from './helpers.js';

describe('Shares API', () => {
  let app;
  let db;

  beforeEach(async () => {
    db = createTestDb();
    seedUser(db);
    seedProject(db);

    vi.resetModules();
    vi.doMock('../db/database.js', () => ({ default: db }));

    const sharesModule = await import('../routes/shares.js');

    app = express();
    app.use(express.json());
    app.use(fakeAuth());
    app.use('/api/projects', sharesModule.default);
    // Also mount the accept route
    app.use('/api/shares', sharesModule.default);
  });

  it('GET /:projectId/shares returns empty list initially', async () => {
    const res = await request(app).get('/api/projects/proj-1/shares');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /:projectId/shares creates email share', async () => {
    const res = await request(app)
      .post('/api/projects/proj-1/shares')
      .send({ email: 'friend@test.com', role: 'viewer' });
    expect(res.status).toBe(201);
    expect(res.body.invited_email).toBe('friend@test.com');
    expect(res.body.role).toBe('viewer');
  });

  it('POST /:projectId/shares returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/projects/proj-1/shares')
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('POST /:projectId/shares returns 400 for invalid role', async () => {
    const res = await request(app)
      .post('/api/projects/proj-1/shares')
      .send({ email: 'a@b.com', role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('POST /:projectId/shares returns 409 for duplicate', async () => {
    await request(app)
      .post('/api/projects/proj-1/shares')
      .send({ email: 'dup@test.com', role: 'viewer' });
    const res = await request(app)
      .post('/api/projects/proj-1/shares')
      .send({ email: 'dup@test.com', role: 'editor' });
    expect(res.status).toBe(409);
  });

  it('PATCH /:projectId/shares/:shareId updates role', async () => {
    const createRes = await request(app)
      .post('/api/projects/proj-1/shares')
      .send({ email: 'up@test.com', role: 'viewer' });
    const shareId = createRes.body.id;

    const res = await request(app)
      .patch(`/api/projects/proj-1/shares/${shareId}`)
      .send({ role: 'editor' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('editor');
  });

  it('PATCH with nonexistent share returns 404', async () => {
    const res = await request(app)
      .patch('/api/projects/proj-1/shares/nonexistent')
      .send({ role: 'editor' });
    expect(res.status).toBe(404);
  });

  it('DELETE /:projectId/shares/:shareId removes share', async () => {
    const createRes = await request(app)
      .post('/api/projects/proj-1/shares')
      .send({ email: 'del@test.com', role: 'viewer' });
    const shareId = createRes.body.id;

    const res = await request(app).delete(`/api/projects/proj-1/shares/${shareId}`);
    expect(res.status).toBe(204);

    const listRes = await request(app).get('/api/projects/proj-1/shares');
    expect(listRes.body).toEqual([]);
  });

  it('POST /:projectId/shares/link generates shareable link', async () => {
    const res = await request(app)
      .post('/api/projects/proj-1/shares/link')
      .send({ role: 'viewer' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.url).toContain('/share/');
  });

  it('POST /accept/:token creates personal share', async () => {
    const linkRes = await request(app)
      .post('/api/projects/proj-1/shares/link')
      .send({ role: 'editor' });
    const token = linkRes.body.token;

    const res = await request(app)
      .post(`/api/shares/accept/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.projectId).toBe('proj-1');
  });

  it('POST /accept/:token returns 404 for invalid token', async () => {
    const res = await request(app)
      .post('/api/shares/accept/invalid-token-value');
    expect(res.status).toBe(404);
  });

  it('POST /:projectId/shares returns 400 for missing email', async () => {
    const res = await request(app)
      .post('/api/projects/proj-1/shares')
      .send({ role: 'viewer' });
    expect(res.status).toBe(400);
  });
});
