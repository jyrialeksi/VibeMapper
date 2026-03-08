import { Router } from 'express';
import { randomUUID } from 'crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from 'mcp-server/server';
import { createApiClient } from 'mcp-server/api-client';

const router = Router();
const sessions = new Map();

router.post('/', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  if (sessionId) {
    // Existing session
    const session = sessions.get(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    return session.transport.handleRequest(req, res, req.body);
  }

  // New session — must be an initialize request
  const isInit = Array.isArray(req.body)
    ? req.body.some((msg) => msg.method === 'initialize')
    : req.body?.method === 'initialize';

  if (!isInit) {
    return res.status(400).json({ error: 'Missing Mcp-Session-Id header' });
  }

  // Create MCP server with user's token calling back to ourselves
  const token = req.headers.authorization?.slice(7) || '';
  const baseUrl = `http://localhost:${process.env.PORT || 3001}`;
  const apiClient = createApiClient(baseUrl, token);
  const server = createMcpServer(apiClient);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  transport.onclose = () => {
    const sid = transport.sessionId;
    if (sid) sessions.delete(sid);
  };

  await server.connect(transport);

  // We need to handle the request first to generate the session ID
  await transport.handleRequest(req, res, req.body);

  // Store session after initialization (sessionId is set after handleRequest)
  const sid = transport.sessionId;
  if (sid) {
    sessions.set(sid, { transport, server });
  }
});

router.get('/', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing Mcp-Session-Id header' });
  }
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  return session.transport.handleRequest(req, res);
});

router.delete('/', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing Mcp-Session-Id header' });
  }
  const session = sessions.get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  await session.transport.close();
  sessions.delete(sessionId);
  res.status(200).json({ success: true });
});

export default router;
