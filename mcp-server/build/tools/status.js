import { api } from '../api-client.js';
export function registerStatusTools(server) {
    server.tool('update_card_status', 'Set the status of story cards. Parameters: project_id (string), node_ids (string - comma-separated story card IDs), status (string - one of: not-started, in-progress, blocked, testing, done)', async (args) => {
        const validStatuses = ['not-started', 'in-progress', 'blocked', 'testing', 'done'];
        const status = args.status;
        if (!validStatuses.includes(status)) {
            return {
                content: [{ type: 'text', text: `Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}` }],
                isError: true,
            };
        }
        const canvas = (await api.get(`/api/canvas/${args.project_id}`));
        const ids = args.node_ids.split(',').map((s) => s.trim());
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
                    type: 'text',
                    text: `Updated status to "${status}" on ${updatedCount} of ${ids.length} cards.`,
                }],
        };
    });
}
//# sourceMappingURL=status.js.map