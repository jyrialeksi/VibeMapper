import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ApiClient } from '../api-client.js';
import { registerCommentTools } from '../tools/comments.js';

function createMockApi(): ApiClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
}

describe('Comment MCP Tools', () => {
  it('registerCommentTools does not throw', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    const api = createMockApi();
    expect(() => registerCommentTools(server, api)).not.toThrow();
  });
});
