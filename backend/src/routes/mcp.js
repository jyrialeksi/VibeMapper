import { Router } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from 'mcp-server/server';
import { createApiClient } from 'mcp-server/api-client';

const router = Router();

/**
 * Create a fresh MCP server+transport per request (stateless mode).
 * With sessionIdGenerator: undefined, each request is independent.
 */
async function createTransport(req) {
  const token = req.headers.authorization?.slice(7) || '';
  const baseUrl = `http://localhost:${process.env.PORT || 3001}`;
  const apiClient = createApiClient(baseUrl, token);
  const server = createMcpServer(apiClient);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  transport.onerror = (err) => {
    console.error('[MCP] Transport error:', err);
  };

  await server.connect(transport);
  return { server, transport };
}

router.post('/', async (req, res) => {
  const { server, transport } = await createTransport(req);
  try {
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error('[MCP] POST error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  } finally {
    await server.close().catch(() => {});
  }
});

router.get('/', async (req, res) => {
  const { server, transport } = await createTransport(req);
  try {
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error('[MCP] GET error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  } finally {
    await server.close().catch(() => {});
  }
});

router.delete('/', (req, res) => {
  res.status(200).json({ success: true });
});

export default router;
