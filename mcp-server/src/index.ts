import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './server.js';
import { api } from './api-client.js';

const server = createMcpServer(api);
const transport = new StdioServerTransport();
await server.connect(transport);
