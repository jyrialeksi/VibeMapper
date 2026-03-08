import { api } from '../api-client.js';
export function registerNodeTools(server) {
    server.tool('add_nodes', 'Add new nodes and/or edges to an existing story map. Parameters: project_id (string), nodes_json (string - JSON array of nodes to add, or "[]"), edges_json (string - JSON array of edges to add, or "[]")', async (args) => {
        const canvas = (await api.get(`/api/canvas/${args.project_id}`));
        const newNodes = JSON.parse(args.nodes_json);
        const newEdges = JSON.parse(args.edges_json);
        const nodes = [...canvas.nodes, ...newNodes];
        const edges = [...canvas.edges, ...newEdges];
        await api.put(`/api/canvas/${args.project_id}`, { nodes, edges, viewport: canvas.viewport });
        return {
            content: [{
                    type: 'text',
                    text: `Added ${newNodes.length} nodes and ${newEdges.length} edges. Total: ${nodes.length} nodes, ${edges.length} edges.`,
                }],
        };
    });
    server.tool('update_nodes', 'Update data on existing nodes (shallow merge). Parameters: project_id (string), updates_json (string - JSON array of [{id: "node-id", data: {field: "value"}}])', async (args) => {
        const canvas = (await api.get(`/api/canvas/${args.project_id}`));
        const updates = JSON.parse(args.updates_json);
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
                    type: 'text',
                    text: `Updated ${updatedCount} of ${updates.length} nodes.`,
                }],
        };
    });
    server.tool('remove_nodes', 'Remove nodes and their connected edges from a story map. Parameters: project_id (string), node_ids (string - comma-separated node IDs)', async (args) => {
        const canvas = (await api.get(`/api/canvas/${args.project_id}`));
        const idsToRemove = args.node_ids.split(',').map((s) => s.trim());
        const removeSet = new Set(idsToRemove);
        const removedCount = canvas.nodes.filter((n) => removeSet.has(n.id)).length;
        const nodes = canvas.nodes.filter((n) => !removeSet.has(n.id));
        const edges = canvas.edges.filter((e) => !removeSet.has(e.source) && !removeSet.has(e.target));
        await api.put(`/api/canvas/${args.project_id}`, {
            nodes,
            edges,
            viewport: canvas.viewport,
        });
        return {
            content: [{
                    type: 'text',
                    text: `Removed ${removedCount} nodes and their connected edges. Remaining: ${nodes.length} nodes, ${edges.length} edges.`,
                }],
        };
    });
}
//# sourceMappingURL=nodes.js.map