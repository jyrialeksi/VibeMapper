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

Top-level user goals or themes. Displayed in the first row.

```json
{
  "id": "activity-1",
  "type": "activity",
  "position": { "x": 0, "y": 0 },
  "data": {
    "title": "User Authentication",
    "description": "All auth-related functionality",
    "acceptanceCriteria": [],
    "cardType": "activity",
    "priority": "must-have",
    "tags": ["auth"]
  }
}
```

### Step Node

Steps within an activity. Displayed in the second row.

```json
{
  "id": "step-1-1",
  "type": "step",
  "position": { "x": 0, "y": 200 },
  "data": {
    "title": "Login Flow",
    "description": "User login process",
    "acceptanceCriteria": [],
    "cardType": "step",
    "priority": "must-have",
    "tags": []
  }
}
```

### Story Card Node

Individual user stories. Displayed in rows below steps, grouped by priority.

```json
{
  "id": "story-1-1-1",
  "type": "storyCard",
  "position": { "x": 0, "y": 400 },
  "data": {
    "title": "As a user, I want to log in with email so that I can access my account",
    "description": "Standard email/password login",
    "acceptanceCriteria": [
      "Given a registered user, when they enter valid credentials, then they are logged in",
      "Given invalid credentials, when they submit, then an error message is shown"
    ],
    "cardType": "story",
    "priority": "must-have",
    "estimate": "M",
    "tags": ["auth", "mvp"]
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
    "tags": [],
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
| `title` | string | Yes | Card title or user story text |
| `description` | string | Yes | Detailed description (can be empty string) |
| `acceptanceCriteria` | string[] | Yes | List of acceptance criteria (can be empty array) |
| `cardType` | enum | Yes | `"activity"`, `"step"`, `"story"`, or `"annotation"` |
| `priority` | enum | Yes | `"must-have"`, `"should-have"`, `"could-have"`, `"wont-have"` |
| `estimate` | string | No | Size estimate: `"XS"`, `"S"`, `"M"`, `"L"`, `"XL"` |
| `tags` | string[] | No | Arbitrary tags for grouping/filtering |
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
          "title": "User Onboarding",
          "description": "New user registration and setup",
          "acceptanceCriteria": [],
          "cardType": "activity",
          "priority": "must-have",
          "tags": ["onboarding"]
        }
      },
      {
        "id": "step-1-1",
        "type": "step",
        "position": { "x": 0, "y": 200 },
        "data": {
          "title": "Registration",
          "description": "Account creation process",
          "acceptanceCriteria": [],
          "cardType": "step",
          "priority": "must-have",
          "tags": []
        }
      },
      {
        "id": "story-1-1-1",
        "type": "storyCard",
        "position": { "x": 0, "y": 400 },
        "data": {
          "title": "As a new user, I want to sign up with email so that I can create an account",
          "description": "Basic email registration with verification",
          "acceptanceCriteria": [
            "Given a valid email, when I submit the form, then I receive a verification email",
            "Given an already registered email, when I try to sign up, then I see an error"
          ],
          "cardType": "story",
          "priority": "must-have",
          "estimate": "M",
          "tags": ["auth", "mvp"]
        }
      },
      {
        "id": "story-1-1-2",
        "type": "storyCard",
        "position": { "x": 300, "y": 400 },
        "data": {
          "title": "As a new user, I want to sign up with Google SSO so that I can quickly create an account",
          "description": "OAuth2 integration with Google",
          "acceptanceCriteria": [
            "Given a Google account, when I click 'Sign up with Google', then I am registered and logged in"
          ],
          "cardType": "story",
          "priority": "should-have",
          "estimate": "L",
          "tags": ["auth", "sso"]
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
