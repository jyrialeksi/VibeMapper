# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start both frontend (5173) and backend (3001) concurrently
npm run dev

# Build all (frontend + mcp-server)
npm run build

# Frontend only
npm run dev:frontend
npm run build --workspace=frontend    # TypeScript check + Vite build
npm run lint --workspace=frontend     # ESLint

# Backend only
npm run dev:backend                   # node --watch
npm run start --workspace=backend

# MCP Server
npm run build --workspace=mcp-server  # TypeScript compile
npm run start --workspace=mcp-server  # Run MCP server (stdio)
```

Tests use Vitest: `npm test` runs all workspaces, or `npm run test --workspace=frontend` / `npm run test --workspace=backend` individually.

## Architecture

Monorepo (npm workspaces) with three packages: `frontend/`, `backend/`, and `mcp-server/`.

**Backend** — Express + better-sqlite3 (ESM, plain .js files). SQLite database auto-created at `backend/data/app.db` with WAL mode. Env file at `backend/.env` (`ENCRYPTION_KEY`). Route files: `projects.js` (CRUD), `canvas.js` (load/save/import/export + versioning), `ai.js` (generate/edit via OpenRouter), `auth.js` (config/me/logout + API key management + MCP token CRUD), `shares.js` (CRUD for project sharing), `comments.js` (card discussion comments + AI apply), `mcp.js` (MCP HTTP endpoint via StreamableHTTPServerTransport). AI has two modes: **generate** (create map from scratch) and **edit** (surgical operations on existing maps). **Per-user OpenRouter API keys**: each user stores their own API key (encrypted with AES-256-GCM via `ENCRYPTION_KEY` env var); AI features are disabled until a key is set. **Canvas locks during AI edit** (prevents manual edits, shows overlay with cancel button). **AI Diff toggle** dims non-AI-edited nodes to highlight changes. **Authentication** via Firebase Auth (Google `signInWithRedirect`); toggled with `AUTH_ENABLED` env var. Backend reverse-proxies `/__/auth/*` to Firebase and auto-sets `authDomain` to the app's own host (from `req.get('host')`) so redirect auth flows through the proxy instead of `firebaseapp.com`. **MCP API tokens**: users can generate `mcp_`-prefixed API tokens for external tool access; tokens are stored as SHA-256 hashes in `users.mcp_api_token`; `requireAuth` middleware accepts both Firebase tokens and MCP tokens. **Project sharing** with email invitations and shareable links (viewer/editor roles). Rate limiting on auth and AI endpoints.

**Frontend** — React 19 + TypeScript + Vite + Tailwind CSS v4 + @xyflow/react (React Flow) + Zustand + **lucide-react** (icons) + **Firebase Auth** (Google sign-in). Vite proxies `/api` → `localhost:3001`. Features include **undo/redo** (stack-based, max 50), **priority filtering** (hide/show cards by priority), **Markdown export**, **dark mode** (class-based, persisted to localStorage, OS preference detection), **LayoutCorrector** (measures DOM heights to fix overlapping nodes after AI generation or auto-arrange), **canvas lock during AI edit** (disables all interactions, shows overlay with spinner + cancel), **AI Diff toggle** (dims unaffected nodes/edges to highlight last AI changes), **Google login** (conditional on server config), **project sharing** (SharePanel with email invites, link sharing, role management), **viewer mode** (read-only canvas for viewers), **persisted visibility** (description/AC toggles saved per-project, synced live via SSE). **Interaction model:** Desktop — click selects (highlight ring + draggable), double-click opens sidebar CardEditor, Escape deselects/closes, Delete removes selected node; desktop renders Toolbar (top bar), CardEditor (right sidebar), AIPromptBox (bottom). Mobile (`<768px` via `useIsMobile`): tap selects with floating NodeContextBar (Edit/Delete), double-tap or Edit opens MobileCardEditor bottom sheet, MobileToolbar hamburger menu, MobileAIButton FAB. Selected node becomes per-node draggable while `nodesDraggable={false}` globally. UI uses glass morphism styling (backdrop-blur, semi-transparent backgrounds) on floating panels.

**Data flow:** React Flow canvas state (nodes/edges/viewport) lives in Zustand (`useMapStore`). Auto-save debounces 2s then PUTs JSON to `/api/canvas/:projectId`. Backend stores nodes/edges/viewport as JSON text columns in SQLite. **Node highlights:** After AI edit/merge, affected nodes get green (added) or amber (modified) outline+pulse via CSS classes driven by `highlightedNodes` Map in the store; auto-cleared after 5s by `HighlightClearer`. **AI Diff:** `lastAIEditNodeIds` Set tracks which nodes were touched; `showLastAIEdit` toggle dims everything else to 15% opacity. **Canvas lock:** `isAIEditing` flag disables all ReactFlow interactions; `cancelAIEdit` callback aborts the fetch via AbortController. **Live sync:** SSE endpoint (`GET /api/canvas/:projectId/events`) pushes visibility changes to all connected clients; managed by `backend/src/sse/connections.js`.

**AI robustness:** `backend/src/ai/client.js` includes JSON extraction fallback (regex for first `{...}` or `[...]` block), shape validation, and auto-retry with conversational correction when models return prose instead of JSON.

**Local auto-arrange:** Auto-arrange is a local algorithm (not AI-based) — triggered via the "Arrange" button in the top toolbar or `arrangeLocal` in the store, with height-aware positioning by `LayoutCorrector.tsx`.

**MCP Server** (`mcp-server/`) — TypeScript + @modelcontextprotocol/sdk, dual transport: stdio (for local dev via `node build/index.js`) and StreamableHTTP (embedded in Express backend at `/mcp` for production). Uses factory pattern (`createMcpServer(apiClient)`) for dependency injection. Thin translation layer that calls the Express backend over HTTP. Tools: `list_projects`, `create_project`, `get_project`, `delete_project`, `get_story_map`, `set_story_map`, `add_nodes`, `update_nodes`, `remove_nodes`, `update_card_status`, `create_story_map` (high-level: hierarchical input → positioned nodes/edges). Resources: `storymap://format` (static format spec), `storymap://projects` (dynamic list), `storymap://projects/{id}/map` (dynamic template). Env vars: `USM_BACKEND_URL` (default `http://localhost:3001`), `USM_API_TOKEN` (MCP API token, optional in dev mode).

**Card status:** Story cards have optional `status` field (`not-started`, `in-progress`, `blocked`, `testing`, `done`) with colored badges in the card header and status selector in card editors.

## Canvas Data Model

Four node types: `activity`, `step`, `storyCard`, `annotation`. Two edge types: `default` (built-in bezier), `line` (custom straight). Node components in `frontend/src/components/nodes/`, edge components in `frontend/src/components/edges/`. Story cards have optional `status` field (`CardStatus` type) with colored badge display.

**Layout grid** (y-axis): Activities at 0, Steps at 200, Must-have stories at 400, Should-have at 600, Could-have at 800, Won't-have at 1000. Horizontal spacing: 300px. Full spec available as MCP resource `storymap://format`.

**ID convention:** `activity-{N}`, `step-{actN}-{stepN}`, `story-{actN}-{stepN}-{storyN}`, `annotation-{N}`, `edge-{sourceId}-{targetId}`.

## Key Files

- `frontend/src/store/useMapStore.ts` — Zustand store: canvas state, UI state (toolMode, selectedNodeId), all mutation actions
- `frontend/src/hooks/useAutoSave.ts` — Debounced save to backend
- `frontend/src/hooks/useAI.ts` — AI generate/arrange hooks
- `frontend/src/components/Canvas.tsx` — React Flow wrapper, event handlers for tool modes
- `frontend/src/types/index.ts` — TypeScript interfaces, color constants (PRIORITY_COLORS, CARD_TYPE_COLORS, STATUS_COLORS, STATUS_LABELS)
- `backend/src/ai/prompts.js` — System prompts that define JSON output format for AI
- `backend/src/ai/models.js` — Available OpenRouter model list
- `backend/src/db/migrations.js` — SQLite schema (projects, canvas_states, ai_history, canvas_versions, users, project_shares, card_comments)
- `backend/src/db/versions.js` — Canvas versioning queries (save/list/restore snapshots)
- `backend/src/routes/canvas.js` — Canvas load/save/import/export + version management + visibility + SSE events endpoints
- `backend/src/sse/connections.js` — SSE connection manager (addClient/broadcast per project)
- `backend/src/utils/encryption.js` — AES-256-GCM encrypt/decrypt for API keys
- `backend/src/routes/auth.js` — Auth config, /me, logout, API key CRUD, MCP token CRUD endpoints
- `backend/src/routes/shares.js` — CRUD for project shares + shareable link generation/acceptance
- `backend/src/routes/comments.js` — Card discussion comments CRUD + AI apply discussion + bulk comment counts + SSE broadcasts
- `backend/src/routes/mcp.js` — MCP HTTP endpoint (StreamableHTTPServerTransport, session management, per-user api client via localhost loopback)
- `backend/src/middleware/auth.js` — `requireAuth` (Firebase token + MCP API token verification), `requireProjectAccess(minRole)` (ownership/share check), `verifyTokenAndGetUser` (reusable token→user helper)
- `frontend/src/hooks/useAuth.ts` — Auth context/hook: Firebase onAuthStateChanged, getIdToken, login/logout, hasApiKey state
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
- `frontend/src/hooks/useIsMobile.ts` — `matchMedia`-based hook returning boolean for `<768px`
- `frontend/src/components/panels/MobileToolbar.tsx` — Mobile floating menu button + popover with organized tool groups
- `frontend/src/components/panels/MobileAIButton.tsx` — Mobile AI FAB (bottom-right) with bottom sheet prompt input
- `frontend/src/components/panels/MobileCardEditor.tsx` — Mobile bottom sheet card editor (60vh, swipe-to-dismiss)
- `frontend/src/components/panels/NodeContextBar.tsx` — Mobile floating popup near selected node (Edit/Delete buttons)
- `frontend/src/components/panels/McpServerPanel.tsx` — MCP Server setup card (token management, tool list, Claude Code/Cursor setup guides)
- `mcp-server/src/server.ts` — `createMcpServer(apiClient)` factory (registers all tools/resources with injected API client)
- `mcp-server/src/index.ts` — MCP server stdio entry point (uses factory + default api client from env vars)
- `mcp-server/src/api-client.ts` — HTTP client for backend API (USM_BACKEND_URL, USM_API_TOKEN)
- `mcp-server/src/tools/` — MCP tool registrations (projects, canvas, nodes, status, create-map)
- `mcp-server/src/resources/index.ts` — MCP resource registrations (format, projects, project map)
- `mcp-server/src/utils/layout.ts` — Layout algorithm: hierarchical input → positioned nodes/edges

## MCP Server Configuration

```bash
# Build MCP server
npm run build --workspace=mcp-server

# Add to Claude Code (dev mode, no auth needed)
claude mcp add user-story-mapper -- node /path/to/mcp-server/build/index.js

# With auth (set env vars)
claude mcp add user-story-mapper -e USM_BACKEND_URL=http://localhost:3001 -e USM_API_TOKEN=mcp_xxx -- node /path/to/mcp-server/build/index.js
```

## Conventions

- Backend uses ESM (`"type": "module"`) with plain `.js` files — no TypeScript
- Frontend has strict TypeScript (`noUnusedLocals`, `noUnusedParameters`)
- Tailwind v4 imported via `@import "tailwindcss"` in `index.css` (no tailwind.config)
- Node components use React Flow's `Handle` for connections and `NodeProps<Node<StoryCardData>>` typing
- `mergeNodes()` in the store offsets AI-generated nodes if they overlap existing ones
- **Git commits**: Always create a local git commit after completing each full task/feature. Use descriptive commit messages.
- **Pre-commit testing**: Before every git commit, run all unit tests (`npm test`) and e2e tests (`npx playwright test`). All tests must pass. If any test fails, diagnose and fix the issue before committing. Never commit or push code with failing tests.
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
- **Visibility toggle + LayoutCorrector timing**: Setting `pendingLayout: 'fullArrange'` in the same Zustand `set()` as a visibility change fails — the LayoutCorrector's no-dep-array effect gets its timer cancelled by re-renders from the visibility change propagating to node components. Fix: LayoutCorrector watches `showDescriptions`/`showAcceptanceCriteria` in a dedicated `useEffect` with a proper dependency array, waits 220ms for content CSS transitions to finish and React Flow to re-measure DOM heights, then runs `fullArrange` with real measured heights. Using `estimateHeight` (empty nodeLookup) produces inaccurate positions at scale.
- **Animating card content show/hide**: Conditional rendering (`{show && <div>...}`) can't be animated — element is removed from DOM instantly. Fix: always render the content, wrap in a CSS grid container with `grid-template-rows: 0fr`/`1fr` transition. The inner div has `overflow: hidden`. This animates height from 0 to auto smoothly. Position animation uses a temporary `.layout-animating` CSS class on the React Flow container to add `transition: transform` only during rearrange (not during drag).
- **Node.js `decipher.update()` needs explicit encoding**: `decipher.update(data)` returns a Buffer; concatenating via `+` with a string relies on implicit `Buffer.toString()` which can be unreliable. Always specify output encoding explicitly: `decipher.update(data, null, 'utf8')`.
- **React hooks must be called before early returns**: Placing `useCallback`/`useMemo`/etc. after conditional `return` statements (e.g., `if (loading) return ...`) violates Rules of Hooks — the hook count changes between renders, causing "Rendered more hooks than during the previous render" crash. Always place all hooks at the top of the component, before any early returns.
- **Auth rate limiter too strict for dev**: React 19 Strict Mode double-fires effects, so each page load sends 2x auth requests. Combined with Vite HMR, 10 req/min was too low. Increased to 30 req/min — still protective in production while comfortable for dev.
- **MCP SDK tool args require Zod schemas**: The `server.tool(name, description, callback)` 3-arg overload passes `(extra)` to the callback, NOT `(args, extra)` — tool arguments are silently discarded, causing `undefined` parameter values at runtime. You MUST use the 4-arg overload `server.tool(name, description, schema, callback)` with a Zod schema for any tool that accepts parameters. If `TS2589: Type instantiation is excessively deep` occurs with typed `server.tool()`, cast to `(server as any).tool()` to bypass the type recursion while keeping the schema at runtime.
- **SSE EventSource leak with async connect**: If an effect creates an EventSource inside an async function (`const connect = async () => { await getToken(); es = new EventSource(...) }`), Strict Mode cleanup runs while `await` is pending, so `es` is still null and `.close()` is a no-op. The EventSource is then created with no cleanup, leaking connections. Fix: add a `cancelled` flag checked after `await` to skip creation. Leaked SSE connections exhaust the browser's HTTP/1.1 per-domain limit (6), causing all subsequent fetches to queue indefinitely.
- **useLayoutEffect for pre-paint state clearing**: When switching contexts (e.g., projects), use `useLayoutEffect` for synchronous state clearing to prevent a flash of stale data. Combine the sync clear + async fetch in one `useLayoutEffect` so Strict Mode's cleanup/re-run cycle always pairs them together — splitting into separate `useLayoutEffect` (clear) + `useEffect` (fetch) can desync in Strict Mode, leaving loading state stuck.
- **Cache static API responses at module level**: Endpoints like `/api/ai/models` that return stable data should be cached in a module-level variable with a shared fetch promise. This prevents Strict Mode double-fires and rapid component remounts from hammering rate-limited endpoints.
- **Firebase `signInWithRedirect` requires own-domain `authDomain`**: `signInWithPopup` fails in production (lingering popup, cross-origin cookie blocking). `signInWithRedirect` fixes this but requires `authDomain` to point to the app's own domain (not `firebaseapp.com`) with a reverse proxy for `/__/auth/*` to Firebase. The backend auto-detects via `req.get('host')` so no env var is needed. Also must serve `/__/firebase/init.json` directly (Firebase Hosting isn't set up, so `firebaseapp.com` 404s it) — the auth handler page fetches it to initialize.
- **EventSource can't set Authorization headers**: The browser's `EventSource` API has no way to set custom HTTP headers. When SSE endpoints sit behind auth middleware that checks `Authorization: Bearer ...`, they'll always 401. Fix: have the auth middleware fall back to `req.query.token` so SSE can pass tokens as query params.
