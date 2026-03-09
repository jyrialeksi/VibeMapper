import { Router } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from 'mcp-server/server';
import { createApiClient } from 'mcp-server/api-client';

const router = Router();

// Cache MCP server+transport instances per user to avoid memory leaks.
// Key: user uid, Value: { server, transport, cleanupTimer }
const userSessions = new Map();

const CLEANUP_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes of inactivity

function cleanupSession(uid) {
  const session = userSessions.get(uid);
  if (!session) return;

  if (session.cleanupTimer) {
    clearTimeout(session.cleanupTimer);
  }

  try {
    session.transport.close?.();
  } catch (err) {
    console.error(`[MCP] Error closing transport for user ${uid}:`, err);
  }

  try {
    session.server.close?.();
  } catch (err) {
    console.error(`[MCP] Error closing server for user ${uid}:`, err);
  }

  userSessions.delete(uid);
}

function resetCleanupTimer(uid) {
  const session = userSessions.get(uid);
  if (!session) return;

  if (session.cleanupTimer) {
    clearTimeout(session.cleanupTimer);
  }

  session.cleanupTimer = setTimeout(() => {
    console.log(`[MCP] Cleaning up inactive session for user ${uid}`);
    cleanupSession(uid);
  }, CLEANUP_TIMEOUT_MS);
}

async function getOrCreateTransport(req) {
  const uid = req.user.id;

  // Reuse existing session for this user
  if (userSessions.has(uid)) {
    const session = userSessions.get(uid);
    resetCleanupTimer(uid);
    return session.transport;
  }

  // Create new session
  const token = req.headers.authorization?.slice(7) || '';
  const baseUrl = `http://localhost:${process.env.PORT || 3001}`;
  const apiClient = createApiClient(baseUrl, token);
  const server = createMcpServer(apiClient);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  userSessions.set(uid, { server, transport, cleanupTimer: null });
  resetCleanupTimer(uid);

  return transport;
}

router.post('/', async (req, res) => {
  try {
    const transport = await getOrCreateTransport(req);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('[MCP] POST error:', err);
    // If the transport is broken, clean up so the next request creates a fresh one
    if (req.user?.id) {
      cleanupSession(req.user.uid);
    }
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.get('/', async (req, res) => {
  try {
    const transport = await getOrCreateTransport(req);
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error('[MCP] GET error:', err);
    if (req.user?.id) {
      cleanupSession(req.user.uid);
    }
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.delete('/', async (req, res) => {
  if (req.user?.id) {
    cleanupSession(req.user.uid);
  }
  res.status(200).json({ success: true });
});

export default router;
