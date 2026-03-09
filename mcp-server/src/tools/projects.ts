import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ApiClient } from '../api-client.js';
import { textResponse } from '../utils/helpers.js';

export function registerProjectTools(server: McpServer, api: ApiClient) {
  server.tool(
    'list_projects',
    'List all story map projects',
    async () => {
      const projects = await api.get('/api/projects');
      return textResponse(projects);
    }
  );

  (server as any).tool(
    'create_project',
    'Create a new empty story map project',
    { name: z.string(), description: z.string().optional() },
    async (args: Record<string, unknown>) => {
      const name = args.name as string;
      const description = (args.description as string) || '';
      const project = await api.post('/api/projects', { name, description });
      return textResponse(project);
    }
  );

  (server as any).tool(
    'get_project',
    'Get project details by ID',
    { project_id: z.string() },
    async (args: Record<string, unknown>) => {
      const project = await api.get(`/api/projects/${args.project_id}`);
      return textResponse(project);
    }
  );

  (server as any).tool(
    'delete_project',
    'Delete a project and all its data',
    { project_id: z.string() },
    async (args: Record<string, unknown>) => {
      await api.delete(`/api/projects/${args.project_id}`);
      return { content: [{ type: 'text' as const, text: `Project ${args.project_id} deleted.` }] };
    }
  );
}
