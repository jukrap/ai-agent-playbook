import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerPlaybookMcpTools } from './mcp-tools.mjs';
import { projectRoot } from './fs-safety.mjs';
import { PACKAGE_VERSION } from './version.mjs';

export async function runMcpServer({ target = process.cwd() } = {}) {
  const root = await projectRoot(target);
  const server = new McpServer({ name: 'aapb', version: PACKAGE_VERSION });
  registerPlaybookMcpTools(server, { target: root });
  await server.connect(new StdioServerTransport());
  return server;
}
