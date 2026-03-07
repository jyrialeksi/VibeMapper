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

Tests use Vitest: `npm test` runs all workspaces, or `npm run test --workspace=frontend` / `npm run test --workspace=backend` individually.

## Architecture

Monorepo (npm workspaces) with two packages: `frontend/` and `backend/`.

**Backend** — Express + better-sqlite3 (ESM, plain .js files). SQLite database auto-created at `backend/data/app.db` with WAL mode. Env file at `backend/.env` (`OPENROUTER_API_KEY`). Route files: `projects.js` (CRUD), `canvas.js` (load/save/import/export + versioning), `ai.js` (generate/edit via OpenRouter), `auth.js` (config/me/logout), `shares.js` (CRUD for project sharing). AI has two modes: **generate** (create map from scratch) and **edit** (surgical operations on existing maps). **Canvas locks during AI edit** (prevents manual edits, shows overlay with cancel button). **AI Diff toggle** dims non-AI-edited nodes to highlight changes. **Authentication** via Firebase Auth (Google sign-in); toggled with `AUTH_ENABLED` env var. **Project sharing** with email invitations and shareable links (viewer/editor roles). Rate limiting on auth and AI endpoints.

**Frontend** — React 19 + TypeScript + Vite + Tailwind CSS v4 + @xyflow/react (React Flow) + Zustand + **lucide-react** (icons) + **Firebase Auth** (Google sign-in). Vite proxies `/api` → `localhost:3001`. Features include **undo/redo** (stack-based, max 50), **priority filtering** (hide/show cards by priority), **Markdown export**, **dark mode** (class-based, persisted to localStorage, OS preference detection), **LayoutCorrector** (measures DOM heights to fix overlapping nodes after AI generation or auto-arrange), **canvas lock during AI edit** (disables all interactions, shows overlay with spinner + cancel), **AI Diff toggle** (dims unaffected nodes/edges to highlight last AI changes), **Google login** (conditional on server config), **project sharing** (SharePanel with email invites, link sharing, role management), **viewer mode** (read-only canvas for viewers). UI uses glass morphism styling (backdrop-blur, semi-transparent backgrounds) on floating panels. Toolbar is responsive (`flex-wrap`) for narrow viewports.

**Data flow:** React Flow canvas state (nodes/edges/viewport) lives in Zustand (`useMapStore`). Auto-save debounces 2s then PUTs JSON to `/api/canvas/:projectId`. Backend stores nodes/edges/viewport as JSON text columns in SQLite. **Node highlights:** After AI edit/merge, affected nodes get green (added) or amber (modified) outline+pulse via CSS classes driven by `highlightedNodes` Map in the store; auto-cleared after 5s by `HighlightClearer`. **AI Diff:** `lastAIEditNodeIds` Set tracks which nodes were touched; `showLastAIEdit` toggle dims everything else to 15% opacity. **Canvas lock:** `isAIEditing` flag disables all ReactFlow interactions; `cancelAIEdit` callback aborts the fetch via AbortController.

**AI robustness:** `backend/src/ai/client.js` includes JSON extraction fallback (regex for first `{...}` or `[...]` block), shape validation, and auto-retry with conversational correction when models return prose instead of JSON.

**Local auto-arrange:** Auto-arrange is a local algorithm (not AI-based) — triggered via `arrangeLocal` in the store, with height-aware positioning by `LayoutCorrector.tsx`.

## Canvas Data Model

Four node types: `activity`, `step`, `storyCard`, `annotation`. Two edge types: `default` (built-in bezier), `line` (custom straight). Node components in `frontend/src/components/nodes/`, edge components in `frontend/src/components/edges/`.

**Layout grid** (y-axis): Activities at 0, Steps at 200, Must-have stories at 400, Should-have at 600, Could-have at 800, Won't-have at 1000. Horizontal spacing: 300px. Full spec in `docs/JSON_FORMAT.md`.

**ID convention:** `activity-{N}`, `step-{actN}-{stepN}`, `story-{actN}-{stepN}-{storyN}`, `annotation-{N}`, `edge-{sourceId}-{targetId}`.

## Key Files

- `frontend/src/store/useMapStore.ts` — Zustand store: canvas state, UI state (toolMode, selectedNodeId), all mutation actions
- `frontend/src/hooks/useAutoSave.ts` — Debounced save to backend
- `frontend/src/hooks/useAI.ts` — AI generate/arrange hooks
- `frontend/src/components/Canvas.tsx` — React Flow wrapper, event handlers for tool modes
- `frontend/src/types/index.ts` — TypeScript interfaces, color constants (PRIORITY_COLORS, CARD_TYPE_COLORS)
- `backend/src/ai/prompts.js` — System prompts that define JSON output format for AI
- `backend/src/ai/models.js` — Available OpenRouter model list
- `backend/src/db/migrations.js` — SQLite schema (projects, canvas_states, ai_history, canvas_versions, users, project_shares)
- `backend/src/db/versions.js` — Canvas versioning queries (save/list/restore snapshots)
- `backend/src/routes/canvas.js` — Canvas load/save/import/export + version management endpoints
- `backend/src/routes/auth.js` — Auth config, /me, logout endpoints
- `backend/src/routes/shares.js` — CRUD for project shares + shareable link generation/acceptance
- `backend/src/middleware/auth.js` — `requireAuth` (Firebase token verification), `requireProjectAccess(minRole)` (ownership/share check)
- `frontend/src/hooks/useAuth.ts` — Auth context/hook: Firebase onAuthStateChanged, getIdToken, login/logout
- `frontend/src/components/AuthProvider.tsx` — Wraps app with AuthContext, connects token provider to API client
- `frontend/src/components/LoginPage.tsx` — Full-page Google sign-in
- `frontend/src/components/panels/SharePanel.tsx` — Slide-over panel for email invites, link sharing, role management
- `frontend/src/lib/firebase.ts` — Firebase app/auth initialization
- `frontend/src/components/LayoutCorrector.tsx` — Measures DOM heights post-render, fixes overlapping nodes. Two modes: `fullArrange` and `correctOverlap`
- `frontend/src/utils/exportToMarkdown.ts` — Structured Markdown export respecting priority filters
- `frontend/src/components/panels/VersionHistoryPanel.tsx` — Version list, create/restore snapshots
- `frontend/src/components/HighlightClearer.tsx` — Auto-clears node highlights after 5s timeout
- `frontend/src/components/ui/AutoExpandTextarea.tsx` — Reusable auto-growing textarea (minRows→maxRows, then scrollable)
- `frontend/src/hooks/useTheme.ts` — Dark mode hook (localStorage + OS preference + class toggle on `<html>`)

## Conventions

- Backend uses ESM (`"type": "module"`) with plain `.js` files — no TypeScript
- Frontend has strict TypeScript (`noUnusedLocals`, `noUnusedParameters`)
- Tailwind v4 imported via `@import "tailwindcss"` in `index.css` (no tailwind.config)
- Node components use React Flow's `Handle` for connections and `NodeProps<Node<StoryCardData>>` typing
- `mergeNodes()` in the store offsets AI-generated nodes if they overlap existing ones
- **Git commits**: Always create a local git commit after completing each full task/feature. Use descriptive commit messages.
- **CLAUDE.md maintenance**: As a final step before each git commit, review this file and update it if the completed work changes the app's architecture, features, key files, or conventions. Skip updates for insignificant changes (typos, minor refactors). Always add a bullet to the Learnings section if a meaningful lesson was discovered during development.

## Learnings

Lessons learned during development — add new entries as they arise.

- **React effect cleanup race condition** (commit `2eb6928`): When a `useEffect` calls a state setter (e.g., `setPendingLayout('none')`) that triggers a re-render, the cleanup function runs and cancels any `setTimeout` set in the same effect. Fix: capture the pending action in a ref during render so the effect has no state dependency causing re-cleanup.
- **AI models ignoring JSON format instructions** (commits `93427f5`, `15b708f`): Some OpenRouter models return prose instead of JSON even with `response_format: { type: "json_object" }`. Fix: fallback to regex extraction of first `{...}` or `[...]` block, then validate shape, then auto-retry once with conversational correction.
- **Node overlap after AI generation** (commits `713e704`, `b171425`): AI generates nodes with fixed y-positions, but story cards have variable heights (acceptance criteria expand them). Fix: `LayoutCorrector` component inside `<ReactFlow>` reads actual measured heights from `nodeLookup` and recomputes y-positions with proper spacing.
- **Local auto-arrange vs AI arrange** (commit `9c72321`): AI-based auto-arrange was slow, cost tokens, and could fail. Replaced with instant local algorithm that rebuilds grid from edge hierarchy and triggers LayoutCorrector for height-aware positioning.
- **Highlight state decoupled from node data**: Using a separate `highlightedNodes` Map (not `node.data` flags) keeps highlights independent of LayoutCorrector's `setState` for repositioning. CSS `outline` (not `border`) avoids box model changes that would affect height measurements.
- **Dark mode with Tailwind v4**: Use `@custom-variant dark (&:where(.dark, .dark *));` in `index.css` to enable class-based dark mode. Flash of wrong theme prevented by inline `<script>` in `index.html` that adds `dark` class before Vite loads. React Flow controls need plain CSS overrides (not Tailwind) since they're outside React's rendering.
- **Left color bar on cards via inset box-shadow**: Overlay divs cause double-border artifacts or kill corner radius with `overflow-hidden`. Thick `border-l` makes inner corners square. Fix: set `--tw-inset-shadow` inline style (`inset 6px 0 0 0 <color>`) which respects `border-radius` and composes with Tailwind v4's `shadow-md` and `ring-*` layers automatically.
