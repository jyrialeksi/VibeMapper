import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ApiClient } from '../api-client.js';
import type { CanvasState } from '../utils/schemas.js';

const FORMAT_DOC = `# User Story Map JSON Format

## Node Types

### Activity
Top-level user goals or epic themes (y=0). An activity groups related steps under a broad capability area.
- **title**: Short name for the capability area (2-5 words). Examples: "User Onboarding", "Organisation Setup", "Content Management"
- **description**: One sentence explaining what this activity encompasses and who it serves. Example: "Admin sets up the organisation, invites users, and imports company playbooks"

### Step
Specific workflow steps within an activity (y=200). A step represents a discrete action or phase the user goes through.
- **title**: Concise action or phase name (2-4 words). Examples: "Authentication", "Create Organisation", "Invite & Onboard Users"
- **description**: One sentence clarifying what happens in this step and who performs it. Example: "Any logged-in user can create and configure a new organisation, becoming its first admin"

### Story Card
Individual user stories under a step (y=400+ by priority). Each story is a specific feature or capability to implement.
- **title**: A user story in standard format: "As a [role], I want to [action] so that [benefit]". Example: "As an admin, I want to register a Polla account so that I can set up and manage my organisation's training"
- **description**: One or two sentences adding context, scope, or clarification beyond the user story title. Example: "Admin creates a secure account using email and password to access the platform for the first time"
- **acceptanceCriteria**: 1-4 items in Given/When/Then format. Keep them short, specific, and testable. Leave out obvious or redundant criteria. Example: ["Given I am a new admin, When I enter a valid email and password and submit, Then my account is created and I am redirected to the setup screen", "Given I submit the registration form, When my email is already in use, Then I see a clear error message"]

### Annotation
Free-form notes or grouping boxes.

## Node Data Fields
- title (string, required)
- description (string, required)
- acceptanceCriteria (string[], required — use [] for activities and steps)
- cardType ("activity" | "step" | "story" | "annotation")
- priority ("must-have" | "should-have" | "could-have" | "wont-have")
- estimate ("XS" | "S" | "M" | "L" | "XL", optional, story cards only)
- status ("not-started" | "in-progress" | "blocked" | "testing" | "done", optional, story cards only)

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

export function registerResources(server: McpServer, api: ApiClient) {
  // Static: JSON format documentation
  server.resource(
    'format',
    'storymap://format',
    { description: 'JSON format specification for story maps' },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: FORMAT_DOC,
        mimeType: 'text/markdown',
      }],
    })
  );

  // Dynamic: project list
  server.resource(
    'projects',
    'storymap://projects',
    { description: 'List of all story map projects' },
    async (uri) => {
      const projects = await api.get('/api/projects');
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(projects, null, 2),
          mimeType: 'application/json',
        }],
      };
    }
  );

  // Dynamic template: project map
  server.resource(
    'project-map',
    new ResourceTemplate('storymap://projects/{id}/map', { list: undefined }),
    { description: 'Current story map for a specific project' },
    async (uri, params) => {
      const id = params.id as string;
      const canvas = (await api.get(`/api/canvas/${id}`)) as CanvasState;
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ nodes: canvas.nodes, edges: canvas.edges }, null, 2),
          mimeType: 'application/json',
        }],
      };
    }
  );
}
