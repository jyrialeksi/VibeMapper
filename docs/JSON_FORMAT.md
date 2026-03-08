# User Story Map JSON Format

This document describes the JSON format used by User Story Mapper AI. Use this as a reference when generating story maps programmatically (e.g., from a Claude Code skill).

## Overview

A story map is a React Flow canvas state containing **nodes** (cards) and **edges** (connections). The JSON structure mirrors the React Flow data model directly.

## Top-Level Structure

```json
{
  "project": {
    "name": "Project Name",
    "description": "Optional description",
    "exported_at": "2025-01-01T00:00:00.000Z"
  },
  "canvas": {
    "nodes": [],
    "edges": [],
    "viewport": { "x": 0, "y": 0, "zoom": 1 }
  }
}
```

When importing, you can also provide the flat structure (without the `project` wrapper):

```json
{
  "nodes": [],
  "edges": [],
  "viewport": { "x": 0, "y": 0, "zoom": 1 }
}
```

## Node Types

### Activity Node

Top-level user goals or epic themes. Displayed in the first row. An activity groups related steps under a broad capability area.

- **title**: Short name for the capability area (2-5 words). Examples: "User Onboarding", "Organisation Setup", "Content Management"
- **description**: One sentence explaining what this activity encompasses and who it serves. Example: "Admin sets up the organisation, invites users, and imports company playbooks"

```json
{
  "id": "activity-1",
  "type": "activity",
  "position": { "x": 0, "y": 0 },
  "data": {
    "title": "Organisation Setup",
    "description": "Admin sets up the organisation, invites users, and imports company playbooks",
    "acceptanceCriteria": [],
    "cardType": "activity",
    "priority": "must-have"
  }
}
```

### Step Node

Specific workflow steps within an activity. Displayed in the second row. A step represents a discrete action or phase the user goes through.

- **title**: Concise action or phase name (2-4 words). Examples: "Authentication", "Create Organisation", "Invite & Onboard Users"
- **description**: One sentence clarifying what happens in this step and who performs it. Example: "Any logged-in user can create and configure a new organisation, becoming its first admin"

```json
{
  "id": "step-1-1",
  "type": "step",
  "position": { "x": 0, "y": 200 },
  "data": {
    "title": "Create Organisation",
    "description": "Any logged-in user can create and configure a new organisation, becoming its first admin",
    "acceptanceCriteria": [],
    "cardType": "step",
    "priority": "must-have"
  }
}
```

### Story Card Node

Individual user stories. Displayed in rows below steps, grouped by priority.

- **title**: A user story in standard format: "As a [role], I want to [action] so that [benefit]"
- **description**: One or two sentences adding context, scope, or clarification beyond the user story title
- **acceptanceCriteria**: 1-4 items in Given/When/Then format. Keep them short, specific, and testable. Leave out obvious or redundant criteria.

```json
{
  "id": "story-1-1-1",
  "type": "storyCard",
  "position": { "x": 0, "y": 400 },
  "data": {
    "title": "As a logged-in user, I want to create a new organisation so that I can set up my own team's environment from scratch",
    "description": "Any authenticated user can create a new organisation after login. The creator automatically becomes the admin of that organisation.",
    "acceptanceCriteria": [
      "Given I am logged in, when I choose to create a new organisation, then I am prompted to enter a name and confirm creation",
      "Given I submit a valid name, when the organisation is created, then I am automatically assigned the admin role",
      "Given the organisation is created, when I land on the dashboard, then I see an empty organisation ready for me to invite members"
    ],
    "cardType": "story",
    "priority": "must-have",
    "estimate": "M",
    "status": "not-started"
  }
}
```

### Annotation Node

Free-form notes or grouping boxes. Resizable.

```json
{
  "id": "annotation-1",
  "type": "annotation",
  "position": { "x": 0, "y": 0 },
  "data": {
    "title": "Sprint 1 Scope",
    "description": "MVP features",
    "acceptanceCriteria": [],
    "cardType": "annotation",
    "priority": "must-have",
    "width": 600,
    "height": 400
  },
  "style": { "width": 600, "height": 400 }
}
```

## Edges

Edges connect nodes. Typically: Activity → Step → Story.

```json
{
  "id": "edge-activity-1-step-1-1",
  "source": "activity-1",
  "target": "step-1-1",
  "type": "default"
}
```

## Data Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Activity/step: short name (2-5 words). Story: user story in "As a [role], I want to [action] so that [benefit]" format |
| `description` | string | Yes | One or two sentences of context (can be empty string for activities/steps if title is self-explanatory) |
| `acceptanceCriteria` | string[] | Yes | Stories: 1-4 Given/When/Then items. Activities and steps: empty array `[]` |
| `cardType` | enum | Yes | `"activity"`, `"step"`, `"story"`, or `"annotation"` |
| `priority` | enum | Yes | `"must-have"`, `"should-have"`, `"could-have"`, `"wont-have"` |
| `estimate` | string | No | Size estimate: `"XS"`, `"S"`, `"M"`, `"L"`, `"XL"` |
| `status` | string | No | Card status: `"not-started"`, `"in-progress"`, `"blocked"`, `"testing"`, `"done"` |
| `color` | string | No | Custom hex color override |
| `width` | number | No | Width in px (annotations only) |
| `height` | number | No | Height in px (annotations only) |

## Layout Conventions

The story map follows a grid layout:

| Row | Y Position | Content |
|-----|-----------|---------|
| 1 | y = 0 | Activities |
| 2 | y = 200 | Steps |
| 3 | y = 400 | Must-have stories |
| 4 | y = 600 | Should-have stories |
| 5 | y = 800 | Could-have stories |

- Nodes are spaced **300px apart** horizontally
- Steps are positioned under their parent activity
- Stories are positioned under their parent step
- Each priority tier occupies its own row

## ID Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Activity | `activity-{N}` | `activity-1` |
| Step | `step-{activityN}-{stepN}` | `step-1-2` |
| Story | `story-{activityN}-{stepN}-{storyN}` | `story-1-2-3` |
| Annotation | `annotation-{N}` | `annotation-1` |
| Edge | `edge-{sourceId}-{targetId}` | `edge-activity-1-step-1-1` |

## Complete Example

```json
{
  "canvas": {
    "nodes": [
      {
        "id": "activity-1",
        "type": "activity",
        "position": { "x": 0, "y": 0 },
        "data": {
          "title": "Organisation Setup",
          "description": "Admin sets up the organisation, invites users, and configures initial settings",
          "acceptanceCriteria": [],
          "cardType": "activity",
          "priority": "must-have"
        }
      },
      {
        "id": "step-1-1",
        "type": "step",
        "position": { "x": 0, "y": 200 },
        "data": {
          "title": "Authentication",
          "description": "Users register and log into the platform securely",
          "acceptanceCriteria": [],
          "cardType": "step",
          "priority": "must-have"
        }
      },
      {
        "id": "story-1-1-1",
        "type": "storyCard",
        "position": { "x": 0, "y": 400 },
        "data": {
          "title": "As an admin, I want to register an account so that I can set up and manage my organisation",
          "description": "Admin creates a secure account using email and password to access the platform for the first time",
          "acceptanceCriteria": [
            "Given I am a new admin, When I enter a valid email and password and submit, Then my account is created and I am redirected to the setup screen",
            "Given I submit the registration form, When my email is already in use, Then I see a clear error message",
            "Given I register successfully, When the process completes, Then I receive a verification email"
          ],
          "cardType": "story",
          "priority": "must-have",
          "estimate": "M"
        }
      },
      {
        "id": "story-1-1-2",
        "type": "storyCard",
        "position": { "x": 300, "y": 600 },
        "data": {
          "title": "As an admin, I want to log in with Google SSO so that I can access my account quickly",
          "description": "OAuth2 integration allowing admins to skip password-based login entirely",
          "acceptanceCriteria": [
            "Given I have a Google account, When I click 'Sign in with Google', Then I am authenticated and redirected to the dashboard"
          ],
          "cardType": "story",
          "priority": "should-have",
          "estimate": "L"
        }
      }
    ],
    "edges": [
      {
        "id": "edge-activity-1-step-1-1",
        "source": "activity-1",
        "target": "step-1-1",
        "type": "default"
      },
      {
        "id": "edge-step-1-1-story-1-1-1",
        "source": "step-1-1",
        "target": "story-1-1-1",
        "type": "default"
      },
      {
        "id": "edge-step-1-1-story-1-1-2",
        "source": "step-1-1",
        "target": "story-1-1-2",
        "type": "default"
      }
    ],
    "viewport": { "x": 0, "y": 0, "zoom": 1 }
  }
}
```

## Using with Claude Code Skill

To generate a story map from a codebase analysis:

1. Analyze the codebase structure and identify features/modules
2. Map features to activities, sub-features to steps, and individual requirements to stories
3. Generate the JSON following this format
4. Import via the API: `POST /api/canvas/:projectId/import` with the JSON body
5. Or save the JSON file and use the Import button in the UI

The AI endpoint (`POST /api/ai/generate`) accepts a natural language prompt and returns nodes/edges in this format automatically.
