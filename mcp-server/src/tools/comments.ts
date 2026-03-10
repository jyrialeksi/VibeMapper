import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ApiClient } from '../api-client.js';

interface Comment {
  id: string;
  node_id: string;
  user_id: string;
  content: string;
  is_system_message: number;
  resolved_at: string | null;
  created_at: string;
  user_name: string;
  user_picture: string;
}

export function registerCommentTools(server: McpServer, api: ApiClient) {
  (server as any).tool(
    'list_comments',
    'List discussion comments on a story card.',
    { project_id: z.string(), node_id: z.string() },
    async (args: Record<string, unknown>) => {
      const comments = (await api.get(
        `/api/projects/${args.project_id}/nodes/${args.node_id}/comments`
      )) as Comment[];

      if (comments.length === 0) {
        return {
          content: [{ type: 'text' as const, text: 'No comments on this card.' }],
        };
      }

      const lines: string[] = [`Comments on ${args.node_id} (${comments.length}):\n`];
      for (const c of comments) {
        const resolved = c.resolved_at ? ' [RESOLVED]' : '';
        const system = c.is_system_message ? ' [SYSTEM]' : '';
        lines.push(`- ${c.user_name || 'Unknown'} (${c.created_at}):${resolved}${system}`);
        lines.push(`  ${c.content}`);
      }

      return {
        content: [{ type: 'text' as const, text: lines.join('\n') }],
      };
    }
  );

  (server as any).tool(
    'add_comment',
    'Add a discussion comment to a story card.',
    {
      project_id: z.string(),
      node_id: z.string(),
      content: z.string().describe('Comment text'),
    },
    async (args: Record<string, unknown>) => {
      const comment = (await api.post(
        `/api/projects/${args.project_id}/nodes/${args.node_id}/comments`,
        { content: args.content }
      )) as Comment;

      return {
        content: [{
          type: 'text' as const,
          text: `Comment added to ${args.node_id} by ${comment.user_name || 'Unknown'}: "${comment.content}"`,
        }],
      };
    }
  );

  (server as any).tool(
    'resolve_comments',
    'Resolve all unresolved comments on a story card.',
    { project_id: z.string(), node_id: z.string() },
    async (args: Record<string, unknown>) => {
      await api.post(
        `/api/projects/${args.project_id}/nodes/${args.node_id}/comments/resolve`
      );

      return {
        content: [{
          type: 'text' as const,
          text: `All comments on ${args.node_id} have been resolved.`,
        }],
      };
    }
  );
}
