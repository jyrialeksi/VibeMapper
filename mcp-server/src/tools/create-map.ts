import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildLayout } from '../utils/layout.js';
import type { ApiClient } from '../api-client.js';
import type { ActivityInput } from '../utils/schemas.js';

export function registerCreateMapTool(server: McpServer, api: ApiClient) {
  (server as any).tool(
    'create_story_map',
    `Create a new project and populate it with a complete story map. The server handles layout, positioning, IDs, and edges automatically.

## Content guidelines

**Activities**: Broad capability areas (2-5 word title). Description is one sentence explaining scope. Example: title "Organisation Setup", description "Admin sets up the organisation, invites users, and imports company playbooks".

**Steps**: Discrete workflow phases within an activity (2-4 word title). Description clarifies who does what. Example: title "Authentication", description "Users register and log into the platform securely".

**Story cards**: Individual features to implement.
- title: User story format — "As a [role], I want to [action] so that [benefit]"
- description: 1-2 sentences adding context beyond the title
- acceptanceCriteria: 1-4 Given/When/Then items, short and testable. Omit obvious criteria.

Priority values: must-have, should-have, could-have, wont-have
Estimate values: XS, S, M, L, XL
Status values: not-started, in-progress, blocked, testing, done`,
    {
      name: z.string().describe('Project name'),
      description: z.string().optional().describe('Project description'),
      activities_json: z.string().describe('JSON array of activities with nested steps and stories. Format: [{ "title": "Capability Area", "description": "What this encompasses", "steps": [{ "title": "Workflow Phase", "description": "Who does what here", "stories": [{ "title": "As a [role], I want to [action] so that [benefit]", "description": "Additional context", "priority": "must-have", "estimate": "M", "acceptanceCriteria": ["Given..., When..., Then..."], "status": "not-started" }] }] }]'),
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
