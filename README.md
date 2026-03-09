# VibeMapper

**AI-powered user story mapping on an interactive canvas.**

Describe your app idea in plain language, and VibeMapper generates a structured user story map — activities, steps, and story cards — laid out on a visual canvas you can edit, rearrange, and share with your team.

Built for developers, product managers, and anyone who plans before they build.

## Features

- **AI Story Map Generation** — Describe what you want to build; the AI creates a full hierarchical story map with activities, steps, and prioritized user stories
- **Interactive Canvas** — Drag, resize, connect, and rearrange cards on a React Flow-powered canvas with undo/redo
- **AI Editing** — Make surgical edits to existing maps with natural language ("add a payment step", "split this story into smaller ones")
- **Priority Lanes** — Must-have, Should-have, Could-have, Won't-have rows with filtering and visibility toggles
- **Card Statuses** — Track progress with not-started, in-progress, blocked, testing, and done states
- **Version History** — Snapshot and restore previous versions of your map
- **Project Sharing** — Invite collaborators by email with viewer/editor roles, or share via link
- **Dark Mode** — Full dark/light theme support with OS preference detection
- **Markdown Export** — Export your story map as structured Markdown
- **Mobile Responsive** — Touch-optimized UI with bottom sheets, floating action buttons, and swipe gestures
- **MCP Server** — Connect your AI coding agent (Claude Code, Cursor, etc.) to read and modify story maps programmatically
- **Self-Hostable** — Run it on your own machine or deploy to any Docker-capable host

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Flow, Zustand |
| Backend | Node.js, Express, better-sqlite3 (SQLite), Firebase Auth |
| AI | OpenRouter API (model-agnostic — pick your preferred LLM) |
| MCP Server | TypeScript, @modelcontextprotocol/sdk (stdio + StreamableHTTP) |
| Deployment | Docker (multi-stage, non-root), Fly.io |

## Prerequisites

- **Node.js** 22+ (LTS recommended)
- **npm** 10+
- An **OpenRouter API key** (for AI features) — get one at [openrouter.ai](https://openrouter.ai)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-username/user-story-mapper-ai.git
cd user-story-mapper-ai
npm install
```

### 2. Configure environment

Create `backend/.env`:

```env
ENCRYPTION_KEY=<random-64-char-hex-string>
```

Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Note:** You don't need an OpenRouter API key in the `.env` file — each user sets their own API key through the in-app settings page.

### 3. Start development servers

```bash
npm run dev
```

This starts both the frontend (http://localhost:5173) and backend (http://localhost:3001) concurrently. The Vite dev server proxies `/api` requests to the backend.

### 4. Use the app

1. Open http://localhost:5173
2. Create a new project
3. Go to **Settings** (gear icon) and add your OpenRouter API key
4. Type a prompt describing your app and hit Generate

## Authentication (Optional)

Auth is **disabled by default** for local development — you get a local dev user automatically.

To enable Google sign-in (required for multi-user/production), add these to `backend/.env`:

```env
AUTH_ENABLED=true
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
```

## Project Structure

```
user-story-mapper-ai/
├── frontend/          # React + TypeScript + Vite
│   └── src/
│       ├── components/   # Canvas, nodes, panels, UI
│       ├── hooks/        # useAI, useAuth, useAutoSave, useTheme
│       ├── store/        # Zustand store (useMapStore)
│       └── api/          # API client
├── backend/           # Express + SQLite (ESM, plain .js)
│   └── src/
│       ├── routes/       # projects, canvas, ai, auth, shares, mcp
│       ├── db/           # SQLite connection, migrations, versioning
│       ├── ai/           # OpenRouter client, prompts, models
│       ├── middleware/    # Auth + project access control
│       └── sse/          # Server-sent events for live sync
├── mcp-server/        # MCP Server (TypeScript)
│   └── src/
│       ├── tools/        # MCP tool definitions
│       ├── resources/    # MCP resource definitions
│       └── utils/        # Layout algorithm, schemas
└── website/           # Marketing landing page
```

## Available Scripts

```bash
# Development
npm run dev                          # Start frontend + backend concurrently
npm run dev:frontend                 # Frontend only (port 5173)
npm run dev:backend                  # Backend only (port 3001, with --watch)

# Build
npm run build                        # Build frontend + MCP server

# Test
npm test                             # Run all workspace tests
npm run test --workspace=frontend    # Frontend tests only
npm run test --workspace=backend     # Backend tests only

# Lint
npm run lint --workspace=frontend    # ESLint (frontend)

# MCP Server
npm run build --workspace=mcp-server # Compile TypeScript
npm run start --workspace=mcp-server # Run MCP server (stdio transport)
```

## MCP Server Setup

The MCP server lets AI coding agents (Claude Code, Cursor, etc.) interact with your story maps programmatically.

### Local development (no auth)

```bash
npm run build --workspace=mcp-server

# Add to Claude Code
claude mcp add user-story-mapper -- node /path/to/mcp-server/build/index.js
```

### With authentication

```bash
claude mcp add user-story-mapper \
  -e USM_BACKEND_URL=http://localhost:3001 \
  -e USM_API_TOKEN=mcp_your-token-here \
  -- node /path/to/mcp-server/build/index.js
```

Generate an MCP API token from the app's Settings page.

## Docker

```bash
# Build
docker build -t user-story-mapper .

# Run
docker run -p 3001:3001 \
  -e ENCRYPTION_KEY=$(openssl rand -hex 32) \
  -v usm-data:/app/backend/data \
  user-story-mapper
```

Then open http://localhost:3001.

## License

MIT
