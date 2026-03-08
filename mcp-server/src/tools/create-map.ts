import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildLayout } from '../utils/layout.js';
import { api } from '../api-client.js';
import type { ActivityInput } from '../utils/schemas.js';

export function registerCreateMapTool(server: McpServer) {
  server.tool(
    'create_story_map',
    `Create a new project and populate it with a complete story map. The server handles layout, positioning, IDs, and edges automatically.

Parameters:
- name (string): Project name
- description (string): Project description (can be empty)
- activities_json (string): JSON string with this structure:
  [{ "title": "Activity", "description": "optional", "steps": [{ "title": "Step", "stories": [{ "title": "Story", "priority": "must-have", "estimate": "M", "acceptanceCriteria": ["..."], "status": "not-started" }] }] }]

Priority values: must-have, should-have, could-have, wont-have
Status values: not-started, in-progress, blocked, testing, done`,
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
