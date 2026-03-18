import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApiClient } from '../api-client.js';

describe('MCP API client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('includes X-Source: mcp header in requests', async () => {
    const client = createApiClient('http://localhost:3001', 'test-token');

    await client.put('/api/canvas/proj-1', { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/canvas/proj-1',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Source': 'mcp',
        }),
      })
    );
  });

  it('includes X-Source: mcp header in GET requests', async () => {
    const client = createApiClient('http://localhost:3001', 'test-token');

    await client.get('/api/projects');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/projects',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Source': 'mcp',
        }),
      })
    );
  });

  it('includes Authorization header when token is provided', async () => {
    const client = createApiClient('http://localhost:3001', 'my-token');

    await client.get('/api/projects');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
          'X-Source': 'mcp',
        }),
      })
    );
  });
});
