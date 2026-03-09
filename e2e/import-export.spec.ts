import { test, expect } from '@playwright/test';
import { createProject, deleteProject } from './helpers';

test.describe('Import/Export', () => {
  let projectId: string;

  test.beforeEach(async () => {
    projectId = await createProject('Import Export Test');
  });

  test.afterEach(async () => {
    await deleteProject(projectId);
  });

  test('export canvas as JSON via API', async () => {
    // Save some data first
    await fetch(`http://localhost:3001/api/canvas/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes: [{ id: 'exp-1', type: 'activity', position: { x: 0, y: 0 }, data: { title: 'Export Test', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } }],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      }),
    });

    // Export — response wraps data in { project, canvas: { nodes, edges, viewport } }
    const res = await fetch(`http://localhost:3001/api/canvas/${projectId}/export`);
    const data = await res.json();

    expect(data.canvas).toBeDefined();
    expect(data.canvas.nodes).toHaveLength(1);
    expect(data.canvas.nodes[0].data.title).toBe('Export Test');
    expect(data.canvas.edges).toBeDefined();
    expect(data.canvas.viewport).toBeDefined();
    expect(data.project).toBeDefined();
    expect(data.project.name).toBe('Import Export Test');
  });

  test('import canvas from JSON via API', async () => {
    const importData = {
      nodes: [
        { id: 'imp-1', type: 'activity', position: { x: 100, y: 0 }, data: { title: 'Imported Activity', description: '', acceptanceCriteria: [], cardType: 'activity', priority: 'must-have' } },
        { id: 'imp-2', type: 'step', position: { x: 100, y: 200 }, data: { title: 'Imported Step', description: '', acceptanceCriteria: [], cardType: 'step', priority: 'must-have' } },
      ],
      edges: [{ id: 'edge-imp-1-imp-2', source: 'imp-1', target: 'imp-2' }],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    const res = await fetch(`http://localhost:3001/api/canvas/${projectId}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(importData),
    });
    const result = await res.json();
    expect(result.success).toBe(true);

    // Verify imported data
    const loadRes = await fetch(`http://localhost:3001/api/canvas/${projectId}`);
    const loaded = await loadRes.json();
    expect(loaded.nodes).toHaveLength(2);
    expect(loaded.edges).toHaveLength(1);
  });

  test('imported nodes match original', async () => {
    const originalNodes = [
      { id: 'orig-1', type: 'storyCard', position: { x: 50, y: 400 }, data: { title: 'Story One', description: 'desc', acceptanceCriteria: ['AC1'], cardType: 'story', priority: 'must-have', estimate: '3 pts' } },
    ];

    await fetch(`http://localhost:3001/api/canvas/${projectId}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes: originalNodes, edges: [], viewport: { x: 0, y: 0, zoom: 1 } }),
    });

    const loadRes = await fetch(`http://localhost:3001/api/canvas/${projectId}`);
    const loaded = await loadRes.json();

    expect(loaded.nodes[0].id).toBe('orig-1');
    expect(loaded.nodes[0].data.title).toBe('Story One');
    expect(loaded.nodes[0].data.estimate).toBe('3 pts');
    expect(loaded.nodes[0].data.acceptanceCriteria).toEqual(['AC1']);
  });
});
