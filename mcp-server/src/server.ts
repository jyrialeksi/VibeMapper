import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ApiClient } from './api-client.js';
import { registerProjectTools } from './tools/projects.js';
import { registerCanvasTools } from './tools/canvas.js';
import { registerNodeTools } from './tools/nodes.js';
import { registerStatusTools } from './tools/status.js';
import { registerCommentTools } from './tools/comments.js';
import { registerCreateMapTool } from './tools/create-map.js';
import { registerResources } from './resources/index.js';

export function createMcpServer(apiClient: ApiClient): McpServer {
  const server = new McpServer({
    name: 'vibemapper',
    version: '1.0.0',
  });

  registerProjectTools(server, apiClient);
  registerCanvasTools(server, apiClient);
  registerNodeTools(server, apiClient);
  registerStatusTools(server, apiClient);
  registerCommentTools(server, apiClient);
  registerCreateMapTool(server, apiClient);
  registerResources(server, apiClient);

  return server;
}
