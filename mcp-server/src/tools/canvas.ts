import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ApiClient } from '../api-client.js';
import type { CanvasState, CanvasNode, CanvasEdge } from '../utils/schemas.js';

export interface FilterResult {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  totalStories: number;
  filteredStories: number;
  filterDescription: string | null;
}

export function filterCanvas(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  priorityFilter?: string[],
  statusFilter?: string[]
): FilterResult {
  const totalStories = nodes.filter(n => n.data.cardType === 'story').length;

  if (!priorityFilter && !statusFilter) {
    return { nodes, edges, totalStories, filteredStories: totalStories, filterDescription: null };
  }

  const removedNodeIds = new Set<string>();
  const filteredNodes = nodes.filter(n => {
    if (n.data.cardType !== 'story') return true;
    const priority = (n.data.priority as string) || 'must-have';
    const status = (n.data.status as string) || 'not-started';
    const matchesPriority = !priorityFilter || priorityFilter.includes(priority);
    const matchesStatus = !statusFilter || statusFilter.includes(status);
    const keep = matchesPriority && matchesStatus;
    if (!keep) removedNodeIds.add(n.id);
    return keep;
  });

  const filteredEdges = edges.filter(e =>
    !removedNodeIds.has(e.source) && !removedNodeIds.has(e.target)
  );

  const filteredStories = filteredNodes.filter(n => n.data.cardType === 'story').length;

  const parts: string[] = [];
  if (priorityFilter) parts.push(`priority=${priorityFilter.join(',')}`);
  if (statusFilter) parts.push(`status=${statusFilter.join(',')}`);
  const filterDescription = parts.join(', ');

  return { nodes: filteredNodes, edges: filteredEdges, totalStories, filteredStories, filterDescription };
}

function formatMapAsText(
  canvas: CanvasState,
  commentCounts?: Record<string, number>,
  allComments?: Record<string, Array<{ content: string; user_name: string; created_at: string; is_system_message: number; resolved_at: string | null }>> | null,
  filterInfo?: { totalStories: number; filteredStories: number; filterDescription: string | null }
): string {
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
  if (filterInfo?.filterDescription) {
    lines.push(`Story Map: ${activities.length} activities, ${steps.length} steps, ${filterInfo.filteredStories}/${filterInfo.totalStories} stories (filtered: ${filterInfo.filterDescription})\n`);
  } else {
    lines.push(`Story Map: ${activities.length} activities, ${steps.length} steps, ${stories.length} stories\n`);
  }

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
        const commentCount = commentCounts?.[story.id];
        const commentsTag = commentCount ? ` (${commentCount} comments)` : '';
        lines.push(`    - [${story.id}] [${priority}]${estimate}${status}${commentsTag} ${story.data.title as string}`);
        if (story.data.description) lines.push(`      ${story.data.description}`);
        const ac = story.data.acceptanceCriteria as string[] | undefined;
        if (ac && ac.length > 0) {
          for (const criterion of ac) {
            lines.push(`      * ${criterion}`);
          }
        }
        if (allComments && allComments[story.id]) {
          const unresolvedComments = allComments[story.id].filter(
            (c) => !c.is_system_message && !c.resolved_at
          );
          const toShow = unresolvedComments.slice(-3);
          if (toShow.length > 0) {
            lines.push(`      Comments${unresolvedComments.length > 3 ? ` (showing last 3 of ${unresolvedComments.length})` : ''}:`);
            for (const c of toShow) {
              lines.push(`        ${c.user_name || 'Unknown'}: ${c.content}`);
            }
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
    'Read a project\'s story map. Returns a human-readable hierarchical summary by default. Set include_json=true to also get raw JSON (needed for set_story_map/add_nodes/update_nodes). Set include_comments=true to show comment threads on cards.',
    {
      project_id: z.string(),
      include_json: z.boolean().optional().describe('Include raw JSON nodes/edges (default: false)'),
      include_comments: z.boolean().optional().describe('Include full comment threads (default: false)'),
      priority: z.array(z.enum(['must-have', 'should-have', 'could-have', 'wont-have']))
        .optional()
        .describe('Filter stories by priority. Only stories with these priorities are shown. If omitted, all priorities are included.'),
      status: z.array(z.enum(['not-started', 'in-progress', 'blocked', 'testing', 'done']))
        .optional()
        .describe('Filter stories by status. Only stories with these statuses are shown. If omitted, all statuses are included. Stories without a status are treated as "not-started".'),
    },
    async (args: Record<string, unknown>) => {
      const canvas = (await api.get(`/api/canvas/${args.project_id}`)) as CanvasState;

      // Apply priority/status filters
      const priorityFilter = args.priority as string[] | undefined;
      const statusFilter = args.status as string[] | undefined;
      const filtered = filterCanvas(canvas.nodes, canvas.edges, priorityFilter, statusFilter);
      canvas.nodes = filtered.nodes;
      canvas.edges = filtered.edges;

      // Fetch comment counts
      const commentCounts = (await api.get(`/api/projects/${args.project_id}/comment-counts`)) as Record<string, number>;

      // Fetch full comments if requested
      let allComments: Record<string, Array<{ content: string; user_name: string; created_at: string; is_system_message: number; resolved_at: string | null }>> | null = null;
      if (args.include_comments) {
        allComments = (await api.get(`/api/projects/${args.project_id}/comments`)) as typeof allComments;
      }

      const filterInfo = filtered.filterDescription ? {
        totalStories: filtered.totalStories,
        filteredStories: filtered.filteredStories,
        filterDescription: filtered.filterDescription,
      } : undefined;

      const text = formatMapAsText(canvas, commentCounts, allComments, filterInfo);
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
