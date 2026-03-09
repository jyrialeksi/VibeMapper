import { test, expect } from '@playwright/test';
import { createProject, deleteProject } from './helpers';

const API = 'http://localhost:3001/api';

test.describe('Sharing', () => {
  let projectId: string;

  test.beforeEach(async () => {
    projectId = await createProject('Share Test');
  });

  test.afterEach(async () => {
    await deleteProject(projectId);
  });

  test('add email share and list it', async () => {
    // Add share
    const addRes = await fetch(`${API}/projects/${projectId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'collaborator@example.com', role: 'editor' }),
    });
    expect(addRes.status).toBe(201);
    const share = await addRes.json();
    expect(share.invited_email).toBe('collaborator@example.com');
    expect(share.role).toBe('editor');

    // List shares
    const listRes = await fetch(`${API}/projects/${projectId}/shares`);
    const shares = await listRes.json();
    expect(shares).toHaveLength(1);
    expect(shares[0].invited_email).toBe('collaborator@example.com');
  });

  test('update share role', async () => {
    const addRes = await fetch(`${API}/projects/${projectId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', role: 'viewer' }),
    });
    const share = await addRes.json();

    const updateRes = await fetch(`${API}/projects/${projectId}/shares/${share.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'editor' }),
    });
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.role).toBe('editor');
  });

  test('delete share', async () => {
    const addRes = await fetch(`${API}/projects/${projectId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'temp@example.com', role: 'viewer' }),
    });
    const share = await addRes.json();

    const delRes = await fetch(`${API}/projects/${projectId}/shares/${share.id}`, {
      method: 'DELETE',
    });
    expect(delRes.status).toBe(204);

    const listRes = await fetch(`${API}/projects/${projectId}/shares`);
    const shares = await listRes.json();
    expect(shares).toHaveLength(0);
  });

  test('shareable link flow: create link → accept → access project', async () => {
    // Generate link
    const linkRes = await fetch(`${API}/projects/${projectId}/shares/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'viewer' }),
    });
    const { token } = await linkRes.json();
    expect(token).toBeTruthy();

    // Accept link
    const acceptRes = await fetch(`${API}/shares/accept/${token}`, {
      method: 'POST',
    });
    expect(acceptRes.status).toBe(200);
    const { projectId: returnedId } = await acceptRes.json();
    expect(returnedId).toBe(projectId);
  });

  test('duplicate share returns 409', async () => {
    await fetch(`${API}/projects/${projectId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dup@example.com', role: 'viewer' }),
    });

    const dupRes = await fetch(`${API}/projects/${projectId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dup@example.com', role: 'editor' }),
    });
    expect(dupRes.status).toBe(409);
  });
});
