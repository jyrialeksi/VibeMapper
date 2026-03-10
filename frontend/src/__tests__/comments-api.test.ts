import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Comments API client', () => {
  let api: typeof import('../api/client').api;

  beforeEach(async () => {
    vi.resetModules();
    global.fetch = vi.fn();
    const mod = await import('../api/client');
    api = mod.api;
  });

  function mockFetch(body: unknown, status = 200) {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: 'OK',
      json: () => Promise.resolve(body),
    });
  }

  it('listComments calls correct endpoint', async () => {
    mockFetch([]);
    await api.listComments('proj-1', 'node-1');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/nodes/node-1/comments'),
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it('addComment sends POST with content', async () => {
    mockFetch({ id: 'c1', content: 'Hello' });
    await api.addComment('proj-1', 'node-1', 'Hello');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/nodes/node-1/comments'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: 'Hello' }),
      })
    );
  });

  it('deleteComment sends DELETE', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true, status: 204, statusText: 'No Content',
      json: () => Promise.resolve(undefined),
    });
    await api.deleteComment('proj-1', 'c1');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/comments/c1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('getCommentCounts calls correct endpoint', async () => {
    mockFetch({ 'node-1': 3 });
    const counts = await api.getCommentCounts('proj-1');
    expect(counts).toEqual({ 'node-1': 3 });
  });

  it('applyComments sends POST with model', async () => {
    mockFetch({ mode: 'edit', operations: [] });
    await api.applyComments('proj-1', 'node-1', 'model-1');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/nodes/node-1/comments/apply'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ model: 'model-1' }),
      })
    );
  });

  it('resolveComments sends POST to resolve endpoint', async () => {
    mockFetch({ systemComment: { id: 'sys1', content: 'Comments resolved by Test User', is_system_message: true } });
    const result = await api.resolveComments('proj-1', 'node-1');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1/nodes/node-1/comments/resolve'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result.systemComment.is_system_message).toBe(true);
    expect(result.systemComment.content).toContain('resolved');
  });
});
