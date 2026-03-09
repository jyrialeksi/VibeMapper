# Security Fixes Plan

Identified during pre-public security review. Work through top-to-bottom by priority.

## Critical

- [x] **1. Add project access check to AI history endpoint**
  - File: `backend/src/routes/ai.js:137-142`
  - `GET /api/ai/history/:projectId` has no `requireProjectAccess()` — any authenticated user can read AI history for any project
  - Fix: Add `requireProjectAccess('viewer')` middleware

- [x] **2. Add project access check to AI generate/arrange**
  - File: `backend/src/routes/ai.js:39,112`
  - `POST /api/ai/generate` and `POST /api/ai/arrange` accept `projectId` in body but never verify access
  - Fix: Validate project access when `projectId` is provided

## High

- [x] **3. Sanitize error messages returned to clients**
  - File: `backend/src/routes/ai.js:107,131`
  - Raw `err.message` sent to client — may leak OpenRouter API details or DB errors
  - Fix: Return generic error message, log full error server-side only

- [x] **4. Remove verbose project dump from auth middleware**
  - File: `backend/src/middleware/auth.js:117`
  - On 404, logs all project IDs/names via `JSON.stringify(allProjects...)`
  - Fix: Remove or gate behind `NODE_ENV !== 'production'`

- [x] **5. Add security headers (helmet)**
  - File: `backend/src/server.js`
  - No security headers set (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
  - Fix: Add `helmet` middleware

- [x] **6. Add non-root user to Dockerfile**
  - File: `Dockerfile`
  - Production stage runs as root
  - Fix: Add `adduser` + `USER` directive

- [ ] **7. Add input validation on canvas save**
  - File: `backend/src/routes/canvas.js:26-46`
  - No validation of structure or size on nodes/edges/viewport
  - Fix: Validate schema, enforce reasonable limits on node/edge counts

## Medium

- [ ] **8. Add rate limiting to remaining CRUD endpoints**
  - File: `backend/src/server.js`
  - Only `/api/auth` and `/api/ai` have rate limits — projects, canvas, shares do not
  - Fix: Add general rate limiter for all API routes

- [ ] **9. Add expiration to share link tokens**
  - File: `backend/src/routes/shares.js`, `backend/src/db/migrations.js`
  - Share tokens are valid forever once created
  - Fix: Add `expires_at` column, check on acceptance

- [ ] **10. Rate limit MCP endpoint**
  - File: `backend/src/routes/mcp.js`
  - Each request creates a new MCP server instance — resource exhaustion vector
  - Fix: Add rate limiting, consider connection pooling

- [ ] **11. Reduce JSON body limit**
  - File: `backend/src/server.js:50`
  - Currently 10MB — generous for this app
  - Fix: Reduce to 1-2MB

- [ ] **12. Fail closed on auth config failure (frontend)**
  - File: `frontend/src/hooks/useAuth.ts:118-123`
  - If `/api/auth/config` fetch fails, falls back to unauthenticated dev user
  - Fix: In production builds, show error instead of falling back

## Low

- [ ] **13. Move Firebase API key from deploy.sh to env var**
  - File: `deploy.sh:61`
  - Hardcoded `AIzaSy...` — public by design but cleaner as env var

- [ ] **14. Add `**/.env` and `firebase-service-account.json` to .dockerignore**
  - File: `.dockerignore`
  - Current patterns work but could be more explicit

- [ ] **15. Add try-catch around JSON.parse on DB values**
  - File: `backend/src/routes/canvas.js` (multiple locations)
  - Malformed JSON in DB would crash request handler

- [ ] **16. Add canvas version pruning**
  - File: `backend/src/routes/canvas.js`
  - Every auto-save creates a version with no cleanup — unbounded growth
