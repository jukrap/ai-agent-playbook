import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { registerPlaybookMcpTools } from './mcp-tools.mjs';

export async function runMcpServer(options) {
  const { repoRoot } = options;
  const version = await readPackageVersion(repoRoot);
  const server = new McpServer({
    name: 'ai-agent-playbook',
    version
  });
  registerPlaybookMcpTools(server, { repoRoot });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function readPackageVersion(repoRoot) {
  try {
    const parsed = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
    return typeof parsed.version === 'string' ? parsed.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}
