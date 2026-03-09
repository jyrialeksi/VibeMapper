import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SSE connections', () => {
  let addClient, broadcast;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../sse/connections.js');
    addClient = mod.addClient;
    broadcast = mod.broadcast;
  });

  function mockRes() {
    const listeners = {};
    return {
      write: vi.fn(),
      on: vi.fn((event, cb) => { listeners[event] = cb; }),
      _listeners: listeners,
    };
  }

  it('addClient registers and broadcast sends message', () => {
    const res = mockRes();
    addClient('proj-1', 'user-1', res);

    broadcast('proj-1', 'visibility', { show: true });
    expect(res.write).toHaveBeenCalledWith(
      expect.stringContaining('event: visibility')
    );
  });

  it('broadcast excludes specified userId', () => {
    const res1 = mockRes();
    const res2 = mockRes();
    addClient('proj-1', 'user-1', res1);
    addClient('proj-1', 'user-2', res2);

    broadcast('proj-1', 'test', { data: 1 }, 'user-1');
    expect(res1.write).not.toHaveBeenCalled();
    expect(res2.write).toHaveBeenCalled();
  });

  it('client removed on connection close', () => {
    const res = mockRes();
    addClient('proj-1', 'user-1', res);

    // Simulate connection close
    res._listeners.close();

    broadcast('proj-1', 'test', {});
    // After close, write should not be called again
    expect(res.write).not.toHaveBeenCalled();
  });

  it('broadcast to nonexistent project is no-op', () => {
    // Should not throw
    broadcast('nonexistent', 'test', {});
  });
});
