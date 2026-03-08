import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ApiClient } from '../api-client.js';
import type { CanvasState } from '../utils/schemas.js';

export function registerStatusTools(server: McpServer, api: ApiClient) {
  server.tool(
    'update_card_status',
    'Set the status of story cards. Parameters: project_id (string), node_ids (string - comma-separated story card IDs), status (string - one of: not-started, in-progress, blocked, testing, done)',
    async (args: Record<string, unknown>) => {
      const validStatuses = ['not-started', 'in-progress', 'blocked', 'testing', 'done'];
      const status = args.status as string;
      if (!validStatuses.includes(status)) {
        return {
          content: [{ type: 'text' as const, text: `Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}` }],
          isError: true,
        };
      }

      const canvas = (await api.get(`/api/canvas/${args.project_id}`)) as CanvasState;
      const ids = (args.node_ids as string).split(',').map((s) => s.trim());
      const idSet = new Set(ids);
      let updatedCount = 0;

      for (const node of canvas.nodes) {
        if (idSet.has(node.id) && node.data.cardType === 'story') {
          node.data.status = status;
          updatedCount++;
        }
      }

      await api.put(`/api/canvas/${args.project_id}`, {
        nodes: canvas.nodes,
        edges: canvas.edges,
        viewport: canvas.viewport,
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Updated status to "${status}" on ${updatedCount} of ${ids.length} cards.`,
        }],
      };
    }
  );
}
