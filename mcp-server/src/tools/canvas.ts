import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ApiClient } from '../api-client.js';
import type { CanvasState } from '../utils/schemas.js';

function formatMapAsText(canvas: CanvasState): string {
  const { nodes, edges } = canvas;

  const activities = nodes.filter((n) => n.data.cardType === 'activity');
  const steps = nodes.filter((n) => n.data.cardType === 'step');
  const stories = nodes.filter((n) => n.data.cardType === 'story');

  const childEdges = new Map<string, string[]>();
  for (const edge of edges) {
    const children = childEdges.get(edge.source) || [];
    children.push(edge.target);
    childEdges.set(edge.source, children);
  }

  const lines: string[] = [];
  lines.push(`Story Map: ${activities.length} activities, ${steps.length} steps, ${stories.length} stories\n`);

  for (const act of activities) {
    lines.push(`## [${act.id}] ${act.data.title as string}`);
    if (act.data.description) lines.push(`   ${act.data.description}`);

    const actStepIds = childEdges.get(act.id) || [];
    for (const stepId of actStepIds) {
      const step = nodes.find((n) => n.id === stepId);
      if (!step) continue;
      lines.push(`  ### [${step.id}] ${step.data.title as string}`);
      if (step.data.description) lines.push(`      ${step.data.description}`);

      const stepStoryIds = childEdges.get(step.id) || [];
      for (const storyId of stepStoryIds) {
        const story = nodes.find((n) => n.id === storyId);
        if (!story) continue;
        const priority = story.data.priority || 'must-have';
        const estimate = story.data.estimate ? ` [${story.data.estimate}]` : '';
        const status = story.data.status ? ` (${story.data.status})` : '';
        lines.push(`    - [${story.id}] [${priority}]${estimate}${status} ${story.data.title as string}`);
        if (story.data.description) lines.push(`      ${story.data.description}`);
        const ac = story.data.acceptanceCriteria as string[] | undefined;
        if (ac && ac.length > 0) {
          for (const criterion of ac) {
            lines.push(`      * ${criterion}`);
          }
        }
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function registerCanvasTools(server: McpServer, api: ApiClient) {
  (server as any).tool(
    'get_story_map',
    'Read a project\'s story map. Returns a human-readable hierarchical summary by default. Set include_json=true to also get raw JSON (needed for set_story_map/add_nodes/update_nodes). For large maps, prefer the summary-only default.',
    { project_id: z.string(), include_json: z.boolean().optional().describe('Include raw JSON nodes/edges (default: false)') },
    async (args: Record<string, unknown>) => {
      const canvas = (await api.get(`/api/canvas/${args.project_id}`)) as CanvasState;
      const text = formatMapAsText(canvas);
      const content: Array<{ type: 'text'; text: string }> = [
        { type: 'text' as const, text },
      ];
      if (args.include_json) {
        const json = JSON.stringify({ nodes: canvas.nodes, edges: canvas.edges }, null, 2);
        content.push({ type: 'text' as const, text: `\n---\nRaw JSON:\n${json}` });
      }
      return { content };
    }
  );

  (server as any).tool(
    'set_story_map',
    'Replace the entire canvas of a project.',
    { project_id: z.string(), nodes_json: z.string().describe('JSON array of nodes'), edges_json: z.string().describe('JSON array of edges') },
    async (args: Record<string, unknown>) => {
      const nodes = JSON.parse(args.nodes_json as string);
      const edges = JSON.parse(args.edges_json as string);
      await api.put(`/api/canvas/${args.project_id}`, { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } });
      return {
        content: [{ type: 'text' as const, text: `Canvas updated: ${nodes.length} nodes, ${edges.length} edges.` }],
      };
    }
  );
}
