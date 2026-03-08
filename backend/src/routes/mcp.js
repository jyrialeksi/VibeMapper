import { Router } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from 'mcp-server/server';
import { createApiClient } from 'mcp-server/api-client';

const router = Router();

async function createTransportAndServer(req) {
  const token = req.headers.authorization?.slice(7) || '';
  const baseUrl = `http://localhost:${process.env.PORT || 3001}`;
  const apiClient = createApiClient(baseUrl, token);
  const server = createMcpServer(apiClient);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  return transport;
}

router.post('/', async (req, res) => {
  try {
    const transport = await createTransportAndServer(req);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('[MCP] POST error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.get('/', async (req, res) => {
  try {
    const transport = await createTransportAndServer(req);
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error('[MCP] GET error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.delete('/', async (_req, res) => {
  res.status(200).json({ success: true });
});

export default router;
