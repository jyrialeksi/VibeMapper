import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { api } from '../api-client.js';
const FORMAT_DOC = `# User Story Map JSON Format

## Node Types
- **activity**: Top-level user goals (y=0)
- **step**: Steps within activities (y=200)
- **storyCard**: User stories (y=400+ by priority)
- **annotation**: Free-form notes

## Node Data Fields
- title (string, required)
- description (string, required)
- acceptanceCriteria (string[], required)
- cardType ("activity" | "step" | "story" | "annotation")
- priority ("must-have" | "should-have" | "could-have" | "wont-have")
- estimate ("XS" | "S" | "M" | "L" | "XL", optional)
- status ("not-started" | "in-progress" | "blocked" | "testing" | "done", optional)

## Layout
| Row | Y | Content |
|-----|---|---------|
| 1 | 0 | Activities |
| 2 | 200 | Steps |
| 3 | 400 | Must-have stories |
| 4 | 600 | Should-have stories |
| 5 | 800 | Could-have stories |
| 6 | 1000 | Won't-have stories |

Horizontal spacing: 300px between nodes.

## ID Conventions
- activity-{N}
- step-{actN}-{stepN}
- story-{actN}-{stepN}-{storyN}
- edge-{sourceId}-{targetId}

## Edge Types
- "default": Bezier curve (activity→step, step→story)
- "line": Straight line (custom connections)
`;
export function registerResources(server) {
    // Static: JSON format documentation
    server.resource('format', 'storymap://format', { description: 'JSON format specification for story maps' }, async (uri) => ({
        contents: [{
                uri: uri.href,
                text: FORMAT_DOC,
                mimeType: 'text/markdown',
            }],
    }));
    // Dynamic: project list
    server.resource('projects', 'storymap://projects', { description: 'List of all story map projects' }, async (uri) => {
        const projects = await api.get('/api/projects');
        return {
            contents: [{
                    uri: uri.href,
                    text: JSON.stringify(projects, null, 2),
                    mimeType: 'application/json',
                }],
        };
    });
    // Dynamic template: project map
    server.resource('project-map', new ResourceTemplate('storymap://projects/{id}/map', { list: undefined }), { description: 'Current story map for a specific project' }, async (uri, params) => {
        const id = params.id;
        const canvas = (await api.get(`/api/canvas/${id}`));
        return {
            contents: [{
                    uri: uri.href,
                    text: JSON.stringify({ nodes: canvas.nodes, edges: canvas.edges }, null, 2),
                    mimeType: 'application/json',
                }],
        };
    });
}
//# sourceMappingURL=index.js.map