import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ApiClient } from '../api-client.js';
import type { CanvasState } from '../utils/schemas.js';

export function registerNodeTools(server: McpServer, api: ApiClient) {
  (server as any).tool(
    'add_nodes',
    'Add new nodes and/or edges to an existing story map.',
    { project_id: z.string(), nodes_json: z.string().describe('JSON array of nodes to add, or "[]"'), edges_json: z.string().describe('JSON array of edges to add, or "[]"') },
    async (args: Record<string, unknown>) => {
      const canvas = (await api.get(`/api/canvas/${args.project_id}`)) as CanvasState;
      const newNodes = JSON.parse(args.nodes_json as string);
      const newEdges = JSON.parse(args.edges_json as string);
      const nodes = [...canvas.nodes, ...newNodes];
      const edges = [...canvas.edges, ...newEdges];
      await api.put(`/api/canvas/${args.project_id}`, { nodes, edges, viewport: canvas.viewport });
      return {
        content: [{
          type: 'text' as const,
          text: `Added ${newNodes.length} nodes and ${newEdges.length} edges. Total: ${nodes.length} nodes, ${edges.length} edges.`,
        }],
      };
    }
  );

  (server as any).tool(
    'update_nodes',
    'Update data on existing nodes (shallow merge).',
    { project_id: z.string(), updates_json: z.string().describe('JSON array of [{id: "node-id", data: {field: "value"}}]') },
    async (args: Record<string, unknown>) => {
      const canvas = (await api.get(`/api/canvas/${args.project_id}`)) as CanvasState;
      const updates: Array<{ id: string; data: Record<string, unknown> }> = JSON.parse(args.updates_json as string);
      let updatedCount = 0;

      for (const update of updates) {
        const node = canvas.nodes.find((n) => n.id === update.id);
        if (node) {
          node.data = { ...node.data, ...update.data };
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
          text: `Updated ${updatedCount} of ${updates.length} nodes.`,
        }],
      };
    }
  );

  (server as any).tool(
    'remove_nodes',
    'Remove nodes and their connected edges from a story map.',
    { project_id: z.string(), node_ids: z.string().describe('Comma-separated node IDs') },
    async (args: Record<string, unknown>) => {
      const canvas = (await api.get(`/api/canvas/${args.project_id}`)) as CanvasState;
      const idsToRemove = (args.node_ids as string).split(',').map((s) => s.trim());
      const removeSet = new Set(idsToRemove);
      const removedCount = canvas.nodes.filter((n) => removeSet.has(n.id)).length;

      const nodes = canvas.nodes.filter((n) => !removeSet.has(n.id));
      const edges = canvas.edges.filter(
        (e) => !removeSet.has(e.source) && !removeSet.has(e.target)
      );

      await api.put(`/api/canvas/${args.project_id}`, {
        nodes,
        edges,
        viewport: canvas.viewport,
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Removed ${removedCount} nodes and their connected edges. Remaining: ${nodes.length} nodes, ${edges.length} edges.`,
        }],
      };
    }
  );
}
