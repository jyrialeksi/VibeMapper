import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerProjectTools } from './tools/projects.js';
import { registerCanvasTools } from './tools/canvas.js';
import { registerNodeTools } from './tools/nodes.js';
import { registerStatusTools } from './tools/status.js';
import { registerCreateMapTool } from './tools/create-map.js';
import { registerResources } from './resources/index.js';
const server = new McpServer({
    name: 'user-story-mapper',
    version: '1.0.0',
});
registerProjectTools(server);
registerCanvasTools(server);
registerNodeTools(server);
registerStatusTools(server);
registerCreateMapTool(server);
registerResources(server);
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map