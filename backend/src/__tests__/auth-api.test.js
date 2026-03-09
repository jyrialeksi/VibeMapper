import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createTestDb, seedUser } from './helpers.js';

// Encryption key needed for API key tests
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-auth-tests';

describe('Auth API', () => {
  let app;

  beforeEach(async () => {
    const db = createTestDb();
    // Seed the dev user that requireAuth injects in dev mode
    seedUser(db, 'local-dev', 'dev@local', 'Local Dev');

    vi.resetModules();
    vi.doMock('../db/database.js', () => ({ default: db }));

    const authModule = await import('../routes/auth.js');

    app = express();
    app.use(express.json());
    app.use('/api/auth', authModule.default);
  });

  it('GET /config returns authEnabled=false in dev mode', async () => {
    const res = await request(app).get('/api/auth/config');
    expect(res.status).toBe(200);
    expect(res.body.authEnabled).toBe(false);
  });

  it('GET /me returns user info', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    // In dev mode, requireAuth injects local-dev user
    expect(res.body.email).toBe('dev@local');
  });

  it('POST /logout returns success', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('PUT /api-key stores encrypted key', async () => {
    const res = await request(app)
      .put('/api/auth/api-key')
      .send({ apiKey: 'sk-or-v1-test123' });
    expect(res.status).toBe(200);
    expect(res.body.hasKey).toBe(true);
  });

  it('GET /api-key/status returns hasKey after storing', async () => {
    await request(app)
      .put('/api/auth/api-key')
      .send({ apiKey: 'sk-or-v1-test123' });

    const res = await request(app).get('/api/auth/api-key/status');
    expect(res.status).toBe(200);
    expect(res.body.hasKey).toBe(true);
  });

  it('DELETE /api-key removes key', async () => {
    await request(app)
      .put('/api/auth/api-key')
      .send({ apiKey: 'sk-or-v1-test123' });

    const delRes = await request(app).delete('/api/auth/api-key');
    expect(delRes.status).toBe(200);
    expect(delRes.body.hasKey).toBe(false);

    const statusRes = await request(app).get('/api/auth/api-key/status');
    expect(statusRes.body.hasKey).toBe(false);
  });

  it('PUT /api-key returns 400 on missing key', async () => {
    const res = await request(app)
      .put('/api/auth/api-key')
      .send({});
    expect(res.status).toBe(400);
  });

  it('POST /mcp-token generates mcp_ prefixed token', async () => {
    const res = await request(app).post('/api/auth/mcp-token');
    expect(res.status).toBe(200);
    expect(res.body.token).toMatch(/^mcp_/);
  });

  it('DELETE /mcp-token revokes token', async () => {
    await request(app).post('/api/auth/mcp-token');

    const delRes = await request(app).delete('/api/auth/mcp-token');
    expect(delRes.status).toBe(200);

    const statusRes = await request(app).get('/api/auth/mcp-token/status');
    expect(statusRes.body.hasToken).toBe(false);
  });

  it('GET /mcp-token/status reflects token state', async () => {
    const noToken = await request(app).get('/api/auth/mcp-token/status');
    expect(noToken.body.hasToken).toBe(false);

    await request(app).post('/api/auth/mcp-token');

    const hasToken = await request(app).get('/api/auth/mcp-token/status');
    expect(hasToken.body.hasToken).toBe(true);
  });
});
