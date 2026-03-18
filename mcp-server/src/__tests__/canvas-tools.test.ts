import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ApiClient } from '../api-client.js';
import { registerCanvasTools, filterCanvas } from '../tools/canvas.js';
import type { CanvasNode, CanvasEdge } from '../utils/schemas.js';

function createMockApi(): ApiClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
}

// Test fixture: 1 activity, 2 steps, 4 stories with varying priority/status
function createTestCanvas(): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const nodes: CanvasNode[] = [
    { id: 'activity-1', type: 'activity', position: { x: 0, y: 0 }, data: { cardType: 'activity', title: 'User Management' } },
    { id: 'step-1-1', type: 'step', position: { x: 0, y: 200 }, data: { cardType: 'step', title: 'Login' } },
    { id: 'step-1-2', type: 'step', position: { x: 300, y: 200 }, data: { cardType: 'step', title: 'Profile' } },
    // must-have, not-started (explicit)
    { id: 'story-1-1-1', type: 'storyCard', position: { x: 0, y: 400 }, data: { cardType: 'story', title: 'Login form', priority: 'must-have', status: 'not-started' } },
    // must-have, done
    { id: 'story-1-1-2', type: 'storyCard', position: { x: 0, y: 600 }, data: { cardType: 'story', title: 'OAuth login', priority: 'must-have', status: 'done' } },
    // should-have, no status (defaults to not-started)
    { id: 'story-1-2-1', type: 'storyCard', position: { x: 300, y: 400 }, data: { cardType: 'story', title: 'Edit profile', priority: 'should-have' } },
    // could-have, in-progress
    { id: 'story-1-2-2', type: 'storyCard', position: { x: 300, y: 600 }, data: { cardType: 'story', title: 'Avatar upload', priority: 'could-have', status: 'in-progress' } },
  ];

  const edges: CanvasEdge[] = [
    { id: 'edge-a1-s1', source: 'activity-1', target: 'step-1-1', type: 'default' },
    { id: 'edge-a1-s2', source: 'activity-1', target: 'step-1-2', type: 'default' },
    { id: 'edge-s1-st1', source: 'step-1-1', target: 'story-1-1-1', type: 'default' },
    { id: 'edge-s1-st2', source: 'step-1-1', target: 'story-1-1-2', type: 'default' },
    { id: 'edge-s2-st3', source: 'step-1-2', target: 'story-1-2-1', type: 'default' },
    { id: 'edge-s2-st4', source: 'step-1-2', target: 'story-1-2-2', type: 'default' },
  ];

  return { nodes, edges };
}

describe('filterCanvas', () => {
  it('returns all nodes/edges unchanged when no filters', () => {
    const { nodes, edges } = createTestCanvas();
    const result = filterCanvas(nodes, edges);
    expect(result.nodes).toBe(nodes);
    expect(result.edges).toBe(edges);
    expect(result.totalStories).toBe(4);
    expect(result.filteredStories).toBe(4);
    expect(result.filterDescription).toBeNull();
  });

  it('filters by single priority', () => {
    const { nodes, edges } = createTestCanvas();
    const result = filterCanvas(nodes, edges, ['must-have']);
    const storyIds = result.nodes.filter(n => n.data.cardType === 'story').map(n => n.id);
    expect(storyIds).toEqual(['story-1-1-1', 'story-1-1-2']);
    expect(result.filteredStories).toBe(2);
    expect(result.totalStories).toBe(4);
    expect(result.filterDescription).toBe('priority=must-have');
  });

  it('filters by multiple priorities', () => {
    const { nodes, edges } = createTestCanvas();
    const result = filterCanvas(nodes, edges, ['should-have', 'could-have']);
    const storyIds = result.nodes.filter(n => n.data.cardType === 'story').map(n => n.id);
    expect(storyIds).toEqual(['story-1-2-1', 'story-1-2-2']);
    expect(result.filteredStories).toBe(2);
  });

  it('filters by status, treating missing status as not-started', () => {
    const { nodes, edges } = createTestCanvas();
    const result = filterCanvas(nodes, edges, undefined, ['not-started']);
    const storyIds = result.nodes.filter(n => n.data.cardType === 'story').map(n => n.id);
    // story-1-1-1 has explicit not-started, story-1-2-1 has no status (defaults to not-started)
    expect(storyIds).toEqual(['story-1-1-1', 'story-1-2-1']);
    expect(result.filteredStories).toBe(2);
    expect(result.filterDescription).toBe('status=not-started');
  });

  it('filters by status done', () => {
    const { nodes, edges } = createTestCanvas();
    const result = filterCanvas(nodes, edges, undefined, ['done']);
    const storyIds = result.nodes.filter(n => n.data.cardType === 'story').map(n => n.id);
    expect(storyIds).toEqual(['story-1-1-2']);
    expect(result.filteredStories).toBe(1);
  });

  it('applies both priority and status as intersection', () => {
    const { nodes, edges } = createTestCanvas();
    const result = filterCanvas(nodes, edges, ['must-have'], ['not-started']);
    const storyIds = result.nodes.filter(n => n.data.cardType === 'story').map(n => n.id);
    expect(storyIds).toEqual(['story-1-1-1']);
    expect(result.filteredStories).toBe(1);
    expect(result.filterDescription).toBe('priority=must-have, status=not-started');
  });

  it('preserves activities and steps regardless of filters', () => {
    const { nodes, edges } = createTestCanvas();
    const result = filterCanvas(nodes, edges, ['wont-have'], ['blocked']);
    const nonStoryTypes = result.nodes.filter(n => n.data.cardType !== 'story').map(n => n.data.cardType);
    expect(nonStoryTypes).toEqual(['activity', 'step', 'step']);
    expect(result.filteredStories).toBe(0);
  });

  it('removes edges connected to filtered-out stories', () => {
    const { nodes, edges } = createTestCanvas();
    const result = filterCanvas(nodes, edges, ['must-have']);
    // Only edges to must-have stories + structural edges should remain
    const edgeIds = result.edges.map(e => e.id);
    expect(edgeIds).toContain('edge-a1-s1');
    expect(edgeIds).toContain('edge-a1-s2');
    expect(edgeIds).toContain('edge-s1-st1');
    expect(edgeIds).toContain('edge-s1-st2');
    // Edges to should-have/could-have stories removed
    expect(edgeIds).not.toContain('edge-s2-st3');
    expect(edgeIds).not.toContain('edge-s2-st4');
  });

  it('returns empty stories but keeps structure when nothing matches', () => {
    const { nodes, edges } = createTestCanvas();
    const result = filterCanvas(nodes, edges, ['wont-have']);
    expect(result.filteredStories).toBe(0);
    expect(result.totalStories).toBe(4);
    // Activity and steps preserved
    expect(result.nodes.length).toBe(3);
    // Only structural edges remain (activity→step)
    expect(result.edges.length).toBe(2);
  });
});

describe('Canvas MCP Tools', () => {
  it('registerCanvasTools does not throw', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    const api = createMockApi();
    expect(() => registerCanvasTools(server, api)).not.toThrow();
  });
});
