import { test, expect } from '@playwright/test';
import { createProject, deleteProject } from './helpers';

test.describe('Version history', () => {
  let projectId: string;

  test.beforeEach(async () => {
    projectId = await createProject('Version Test');
  });

  test.afterEach(async () => {
    await deleteProject(projectId);
  });

  test('saving creates a version', async () => {
    // Save canvas data (creates auto-save version)
    await fetch(`http://localhost:3001/api/canvas/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes: [{ id: 'v1', type: 'activity', position: { x: 0, y: 0 }, data: { title: 'V1', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } }],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      }),
    });

    const res = await fetch(`http://localhost:3001/api/canvas/${projectId}/versions`);
    const data = await res.json();
    expect(data.versions.length).toBeGreaterThanOrEqual(1);
  });

  test('create named snapshot', async () => {
    // First save to have a canvas state
    await fetch(`http://localhost:3001/api/canvas/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes: [], edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      }),
    });

    const res = await fetch(`http://localhost:3001/api/canvas/${projectId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Release v1.0' }),
    });
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.version.label).toBe('Release v1.0');
  });

  test('restore previous version', async () => {
    // Save v1
    const v1Res = await fetch(`http://localhost:3001/api/canvas/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes: [{ id: 'original', type: 'activity', position: { x: 0, y: 0 }, data: { title: 'Original', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } }],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      }),
    });
    const v1Data = await v1Res.json();
    const versionId = v1Data.version.id;

    // Save v2 (different data)
    await fetch(`http://localhost:3001/api/canvas/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes: [{ id: 'modified', type: 'activity', position: { x: 0, y: 0 }, data: { title: 'Modified', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } }],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      }),
    });

    // Restore v1
    const restoreRes = await fetch(`http://localhost:3001/api/canvas/${projectId}/versions/${versionId}/restore`, {
      method: 'POST',
    });
    const restored = await restoreRes.json();
    expect(restored.success).toBe(true);
    expect(restored.nodes[0].id).toBe('original');
  });

  test('version list is ordered newest first', async () => {
    for (let i = 1; i <= 3; i++) {
      await fetch(`http://localhost:3001/api/canvas/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: [{ id: `n${i}`, type: 'activity', position: { x: 0, y: 0 }, data: { title: `V${i}`, description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } }],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        }),
      });
    }

    const res = await fetch(`http://localhost:3001/api/canvas/${projectId}/versions`);
    const data = await res.json();
    expect(data.versions.length).toBe(3);
    expect(data.versions[0].version_number).toBe(3);
    expect(data.versions[1].version_number).toBe(2);
    expect(data.versions[2].version_number).toBe(1);
  });
});
