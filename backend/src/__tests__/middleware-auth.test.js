import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createTestDb, seedProject, seedUser } from './helpers.js';

describe('Auth middleware', () => {
  let requireAuth, requireProjectAccess;

  beforeEach(async () => {
    const db = createTestDb();
    seedUser(db, 'owner-1', 'owner@test.com', 'Owner');
    seedUser(db, 'viewer-1', 'viewer@test.com', 'Viewer');
    seedProject(db, 'proj-1', 'Test Project', 'owner-1');
    // Give viewer-1 viewer access
    db.prepare("INSERT INTO project_shares (id, project_id, user_id, invited_email, role) VALUES ('s1', 'proj-1', 'viewer-1', 'viewer@test.com', 'viewer')").run();

    vi.resetModules();
    vi.doMock('../db/database.js', () => ({ default: db }));

    const mod = await import('../middleware/auth.js');
    requireAuth = mod.requireAuth;
    requireProjectAccess = mod.requireProjectAccess;
  });

  function buildApp(middleware, userId = 'owner-1') {
    const a = express();
    a.use(express.json());
    // Inject user manually (simulating already authenticated)
    a.use((req, res, next) => {
      req.user = { id: userId, email: `${userId}@test.com`, name: 'Test' };
      next();
    });
    a.get('/test/:id', middleware, (req, res) => {
      res.json({ role: req.projectRole, project: req.project?.name });
    });
    a.patch('/test/:id', middleware, (req, res) => {
      res.json({ role: req.projectRole });
    });
    return a;
  }

  it('dev mode: requireAuth injects dev user', async () => {
    const a = express();
    a.use(requireAuth);
    a.get('/test', (req, res) => res.json(req.user));

    const res = await request(a).get('/test');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('local-dev');
  });

  it('requireProjectAccess: owner passes', async () => {
    const a = buildApp(requireProjectAccess('owner'), 'owner-1');
    const res = await request(a).get('/test/proj-1');
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('owner');
  });

  it('requireProjectAccess: viewer passes viewer check', async () => {
    const a = buildApp(requireProjectAccess('viewer'), 'viewer-1');
    const res = await request(a).get('/test/proj-1');
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('viewer');
  });

  it('requireProjectAccess: viewer blocked from editor endpoint', async () => {
    const a = buildApp(requireProjectAccess('editor'), 'viewer-1');
    const res = await request(a).patch('/test/proj-1');
    expect(res.status).toBe(403);
  });

  it('requireProjectAccess: nonexistent project returns 404', async () => {
    const a = buildApp(requireProjectAccess('viewer'), 'owner-1');
    const res = await request(a).get('/test/nonexistent');
    expect(res.status).toBe(404);
  });

  it('requireProjectAccess: no access returns 403', async () => {
    const a = buildApp(requireProjectAccess('viewer'), 'stranger');
    const res = await request(a).get('/test/proj-1');
    expect(res.status).toBe(403);
  });
});
