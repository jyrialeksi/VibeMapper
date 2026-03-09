import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('API client', () => {
  let api: typeof import('../api/client').api;
  let setTokenProvider: typeof import('../api/client').setTokenProvider;
  let setOnUnauthorized: typeof import('../api/client').setOnUnauthorized;

  beforeEach(async () => {
    vi.resetModules();
    global.fetch = vi.fn();

    const mod = await import('../api/client');
    api = mod.api;
    setTokenProvider = mod.setTokenProvider;
    setOnUnauthorized = mod.setOnUnauthorized;
  });

  function mockFetch(body: unknown, status = 200) {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(body),
    });
  }

  it('successful GET parses JSON', async () => {
    mockFetch([{ id: 'p1', name: 'Project 1' }]);
    const projects = await api.listProjects();
    expect(projects).toEqual([{ id: 'p1', name: 'Project 1' }]);
  });

  it('sets Authorization header when token provider configured', async () => {
    setTokenProvider(async () => 'my-token');
    mockFetch([]);

    await api.listProjects();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
        }),
      })
    );
  });

  it('401 triggers onUnauthorized callback', async () => {
    const onUnauth = vi.fn();
    setOnUnauthorized(onUnauth);
    mockFetch({ error: 'Unauthorized' }, 401);

    await expect(api.listProjects()).rejects.toThrow('Unauthorized');
    expect(onUnauth).toHaveBeenCalled();
  });

  it('non-ok response throws', async () => {
    mockFetch({ error: 'Server Error' }, 500);
    await expect(api.listProjects()).rejects.toThrow('Server Error');
  });

  it('POST sends JSON body correctly', async () => {
    mockFetch({ id: 'new', name: 'New Project' });

    await api.createProject('New Project', 'Description');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/projects'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New Project', description: 'Description' }),
      })
    );
  });

  it('204 response returns undefined', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: () => Promise.resolve(undefined),
    });

    const result = await api.deleteProject('p1');
    expect(result).toBeUndefined();
  });

  it('no token provider means no auth header', async () => {
    mockFetch([]);
    await api.listProjects();

    const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = callArgs[1].headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});
