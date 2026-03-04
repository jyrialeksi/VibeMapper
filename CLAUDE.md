# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start both frontend (5173) and backend (3001) concurrently
npm run dev

# Frontend only
npm run dev:frontend
npm run build --workspace=frontend    # TypeScript check + Vite build
npm run lint --workspace=frontend     # ESLint

# Backend only
npm run dev:backend                   # node --watch
npm run start --workspace=backend
```

No test framework is configured.

## Architecture

Monorepo (npm workspaces) with two packages: `frontend/` and `backend/`.

**Backend** — Express + better-sqlite3 (ESM, plain .js files). SQLite database auto-created at `backend/data/app.db` with WAL mode. Env file at `backend/.env` (`OPENROUTER_API_KEY`). Three route files: `projects.js` (CRUD), `canvas.js` (load/save/import/export), `ai.js` (generate/arrange via OpenRouter).

**Frontend** — React 19 + TypeScript + Vite + Tailwind CSS v4 + @xyflow/react (React Flow) + Zustand. Vite proxies `/api` → `localhost:3001`.

**Data flow:** React Flow canvas state (nodes/edges/viewport) lives in Zustand (`useMapStore`). Auto-save debounces 2s then PUTs JSON to `/api/canvas/:projectId`. Backend stores nodes/edges/viewport as JSON text columns in SQLite.

## Canvas Data Model

Four node types: `activity`, `step`, `storyCard`, `annotation`. Two edge types: `default` (built-in bezier), `line` (custom straight). Node components in `frontend/src/components/nodes/`, edge components in `frontend/src/components/edges/`.

**Layout grid** (y-axis): Activities at 0, Steps at 200, Must-have stories at 400, Should-have at 600, Could-have at 800. Horizontal spacing: 300px. Full spec in `docs/JSON_FORMAT.md`.

**ID convention:** `activity-{N}`, `step-{actN}-{stepN}`, `story-{actN}-{stepN}-{storyN}`, `annotation-{N}`, `edge-{sourceId}-{targetId}`.

## Key Files

- `frontend/src/store/useMapStore.ts` — Zustand store: canvas state, UI state (toolMode, selectedNodeId), all mutation actions
- `frontend/src/hooks/useAutoSave.ts` — Debounced save to backend
- `frontend/src/hooks/useAI.ts` — AI generate/arrange hooks
- `frontend/src/components/Canvas.tsx` — React Flow wrapper, event handlers for tool modes
- `frontend/src/types/index.ts` — TypeScript interfaces, color constants (PRIORITY_COLORS, CARD_TYPE_COLORS)
- `backend/src/ai/prompts.js` — System prompts that define JSON output format for AI
- `backend/src/ai/models.js` — Available OpenRouter model list
- `backend/src/db/migrations.js` — SQLite schema (projects, canvas_states, ai_history)

## Conventions

- Backend uses ESM (`"type": "module"`) with plain `.js` files — no TypeScript
- Frontend has strict TypeScript (`noUnusedLocals`, `noUnusedParameters`)
- Tailwind v4 imported via `@import "tailwindcss"` in `index.css` (no tailwind.config)
- Node components use React Flow's `Handle` for connections and `NodeProps<Node<StoryCardData>>` typing
- `mergeNodes()` in the store offsets AI-generated nodes if they overlap existing ones
