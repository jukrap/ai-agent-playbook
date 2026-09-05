import { z } from 'zod';
import { playbookStatus, playbookSearch, playbookRead, playbookValidate, RECORD_TOOLS } from './records.mjs';

export { RECORD_TOOLS };
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
export const MAX_MCP_RESULT_CHARS = 12000;
function toolResult(result) {
  return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }], isError: !result.ok };
}
function boundedResult(result) {
  const serialized = JSON.stringify(result);
  const response = toolResult(result);
  if (JSON.stringify(response).length <= MAX_MCP_RESULT_CHARS) return response;
  const summary = { kind: result.kind, ok: result.ok, truncated: true, fullResultChars: serialized.length,
    message: 'Response capped. Narrow the query or read a record in smaller line ranges.', preview: '' };
  let low = 0, high = MAX_MCP_RESULT_CHARS;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    summary.preview = serialized.slice(0, mid);
    if (JSON.stringify(toolResult(summary)).length <= MAX_MCP_RESULT_CHARS) low = mid;
    else high = mid - 1;
  }
  summary.preview = serialized.slice(0, low);
  return toolResult(summary);
}
export function registerPlaybookMcpTools(server, { target }) {
  /** @type {Array<[string, string, Record<string, z.ZodTypeAny>, (args: any) => Promise<any>]>} */
  const definitions = [
    ['playbook_status', 'List project records, layout and current entrypoint. Configuration inspection is not runtime verification.', {}, playbookStatus],
    ['playbook_search', 'Search literal text inside the bound project records with bounded results.', {
      query: z.string().min(1).max(1000), maxResults: z.number().int().min(1).max(100).optional(), maxChars: z.number().int().min(1).max(100000).optional()
    }, playbookSearch],
    ['playbook_read', 'Read a bounded text record using a playbook-relative path; no arbitrary project file access.', {
      path: z.string().min(1).max(1024).optional(), startLine: z.number().int().min(1).max(1000000).optional(), maxChars: z.number().int().min(1).max(100000).optional()
    }, playbookRead],
    ['playbook_validate', 'Validate record JSON, local links and managed-file integrity. Does not execute tests or write files.', {}, playbookValidate]
  ];
  for (const [name, description, inputSchema, handler] of definitions) {
    server.registerTool(name, { description, inputSchema, annotations: READ_ONLY }, async (args) => {
      try {
        return boundedResult(await handler({ ...args, target }));
      } catch (error) {
        return boundedResult({ kind: 'playbook.error', ok: false, message: String(error.message) });
      }
    });
  }
}
