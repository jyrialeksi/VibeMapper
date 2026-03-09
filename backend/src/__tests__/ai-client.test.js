import { describe, it, expect, beforeEach, vi } from 'vitest';

// Must set env before import
process.env.ENCRYPTION_KEY = 'test-key';

describe('AI client', () => {
  let chatCompletion;

  beforeEach(async () => {
    vi.resetModules();
    // Import fresh each time
    const mod = await import('../ai/client.js');
    chatCompletion = mod.chatCompletion;
  });

  function mockFetch(content, status = 200) {
    global.fetch = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve({
        choices: [{ message: { content } }],
      }),
      text: () => Promise.resolve(content),
    });
  }

  it('parses valid JSON response', async () => {
    mockFetch('{"nodes": [], "edges": []}');
    const result = await chatCompletion('key', 'model', [{ role: 'user', content: 'hi' }]);
    expect(result).toEqual({ nodes: [], edges: [] });
  });

  it('strips markdown code fences', async () => {
    mockFetch('```json\n{"result": true}\n```');
    const result = await chatCompletion('key', 'model', [{ role: 'user', content: 'hi' }]);
    expect(result).toEqual({ result: true });
  });

  it('extracts JSON from prose via regex fallback', async () => {
    mockFetch('Here is the result: {"data": [1,2,3]} Hope that helps!');
    const result = await chatCompletion('key', 'model', [{ role: 'user', content: 'hi' }]);
    expect(result).toEqual({ data: [1, 2, 3] });
  });

  it('retries once with correction on non-JSON', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      const content = callCount === 1 ? 'Sorry I cannot do that' : '{"fixed": true}';
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          choices: [{ message: { content } }],
        }),
      });
    });

    const result = await chatCompletion('key', 'model', [{ role: 'user', content: 'hi' }]);
    expect(result).toEqual({ fixed: true });
    expect(callCount).toBe(2);
  });

  it('throws after exhausting retries', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Still no JSON here' } }],
      }),
    });

    await expect(
      chatCompletion('key', 'model', [{ role: 'user', content: 'hi' }])
    ).rejects.toThrow('invalid JSON');
  });

  it('throws on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve('Unauthorized'),
    });

    await expect(
      chatCompletion('key', 'model', [{ role: 'user', content: 'hi' }])
    ).rejects.toThrow('401');
  });

  it('throws when no API key provided', async () => {
    mockFetch('{}');
    await expect(
      chatCompletion(null, 'model', [{ role: 'user', content: 'hi' }])
    ).rejects.toThrow('No API key');
  });

  it('returns raw content in non-JSON mode', async () => {
    mockFetch('Hello world');
    const result = await chatCompletion('key', 'model', [{ role: 'user', content: 'hi' }], { jsonMode: false });
    expect(result).toBe('Hello world');
  });
});
