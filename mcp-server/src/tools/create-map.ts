import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildLayout } from '../utils/layout.js';
import type { ApiClient } from '../api-client.js';
import type { ActivityInput } from '../utils/schemas.js';

export function registerCreateMapTool(server: McpServer, api: ApiClient) {
  (server as any).tool(
    'create_story_map',
    `Create a new project and populate it with a complete story map. The server handles layout, positioning, IDs, and edges automatically.

Priority values: must-have, should-have, could-have, wont-have
Status values: not-started, in-progress, blocked, testing, done`,
    {
      name: z.string().describe('Project name'),
      description: z.string().optional().describe('Project description'),
      activities_json: z.string().describe('JSON array: [{ "title": "Activity", "description": "optional", "steps": [{ "title": "Step", "stories": [{ "title": "Story", "priority": "must-have", "estimate": "M", "acceptanceCriteria": ["..."], "status": "not-started" }] }] }]'),
    },
    async (args: Record<string, unknown>) => {
      const name = args.name as string;
      const description = (args.description as string) || '';
      const activities: ActivityInput[] = JSON.parse(args.activities_json as string);

      const project = (await api.post('/api/projects', { name, description })) as { id: string };
      const { nodes, edges } = buildLayout(activities);

      await api.put(`/api/canvas/${project.id}`, {
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 1 },
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Created project "${name}" (ID: ${project.id}) with ${nodes.length} nodes and ${edges.length} edges.`,
        }],
      };
    }
  );
}
