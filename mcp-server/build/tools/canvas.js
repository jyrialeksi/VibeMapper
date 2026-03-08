import { api } from '../api-client.js';
function formatMapAsText(canvas) {
    const { nodes, edges } = canvas;
    const activities = nodes.filter((n) => n.data.cardType === 'activity');
    const steps = nodes.filter((n) => n.data.cardType === 'step');
    const stories = nodes.filter((n) => n.data.cardType === 'story');
    const childEdges = new Map();
    for (const edge of edges) {
        const children = childEdges.get(edge.source) || [];
        children.push(edge.target);
        childEdges.set(edge.source, children);
    }
    const lines = [];
    lines.push(`Story Map: ${activities.length} activities, ${steps.length} steps, ${stories.length} stories\n`);
    for (const act of activities) {
        lines.push(`## ${act.data.title}`);
        if (act.data.description)
            lines.push(`   ${act.data.description}`);
        const actStepIds = childEdges.get(act.id) || [];
        for (const stepId of actStepIds) {
            const step = nodes.find((n) => n.id === stepId);
            if (!step)
                continue;
            lines.push(`  ### ${step.data.title}`);
            if (step.data.description)
                lines.push(`      ${step.data.description}`);
            const stepStoryIds = childEdges.get(step.id) || [];
            for (const storyId of stepStoryIds) {
                const story = nodes.find((n) => n.id === storyId);
                if (!story)
                    continue;
                const priority = story.data.priority || 'must-have';
                const estimate = story.data.estimate ? ` [${story.data.estimate}]` : '';
                const status = story.data.status ? ` (${story.data.status})` : '';
                lines.push(`    - [${priority}]${estimate}${status} ${story.data.title}`);
                if (story.data.description)
                    lines.push(`      ${story.data.description}`);
                const ac = story.data.acceptanceCriteria;
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
export function registerCanvasTools(server) {
    server.tool('get_story_map', 'Read a project\'s story map. Returns a human-readable summary and raw JSON. Parameters: project_id (string, required)', async (args) => {
        const canvas = (await api.get(`/api/canvas/${args.project_id}`));
        const text = formatMapAsText(canvas);
        const json = JSON.stringify({ nodes: canvas.nodes, edges: canvas.edges }, null, 2);
        return {
            content: [
                { type: 'text', text },
                { type: 'text', text: `\n---\nRaw JSON:\n${json}` },
            ],
        };
    });
    server.tool('set_story_map', 'Replace the entire canvas of a project. Parameters: project_id (string), nodes_json (string - JSON array of nodes), edges_json (string - JSON array of edges)', async (args) => {
        const nodes = JSON.parse(args.nodes_json);
        const edges = JSON.parse(args.edges_json);
        await api.put(`/api/canvas/${args.project_id}`, { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } });
        return {
            content: [{ type: 'text', text: `Canvas updated: ${nodes.length} nodes, ${edges.length} edges.` }],
        };
    });
}
//# sourceMappingURL=canvas.js.map