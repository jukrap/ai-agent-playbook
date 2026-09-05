import { z } from 'zod';
import { playbookStatus, playbookSearch, playbookRead, playbookValidate, RECORD_TOOLS } from './records.mjs';
import { toolResult, fitsResponse, MAX_CONTENT_CHARS, MAX_MCP_RESULT_BYTES } from './record-paging.mjs';

export { RECORD_TOOLS, MAX_MCP_RESULT_BYTES };
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const budget = { maxChars: z.number().int().min(1).max(MAX_CONTENT_CHARS).optional(), cursor: z.string().min(1).max(2048).optional() };
const list = { ...budget, pageSize: z.number().int().min(1).max(100).optional() };
export function registerPlaybookMcpTools(server, { target }) {
  /** @type {Array<[string, string, Record<string, z.ZodTypeAny>, (args: any) => Promise<any>]>} */
  const definitions = [
    ['aapb_status', 'Summarize project records. Select records or warnings view for paged details; repeat the view with cursor.', {
      ...list, view: z.enum(['summary', 'records', 'warnings']).optional()
    }, playbookStatus],
    ['aapb_search', 'Search literal record text with source locations and continuation. Repeat query/view with cursor; changed sources require a restart.', {
      ...budget, query: z.string().min(1).max(1000), maxResults: z.number().int().min(1).max(100).optional(), view: z.enum(['results', 'warnings']).optional()
    }, playbookSearch],
    ['aapb_read', 'Read exact record text with a content budget. Continue with the same path and cursor, without line arguments; source changes reject the cursor.', {
      ...budget, path: z.string().min(1).max(1024).optional(), startLine: z.number().int().min(1).max(1000000).optional(), endLine: z.number().int().min(1).max(1000000).optional()
    }, playbookRead],
    ['aapb_validate', 'Validate record JSON, links and ownership with paged issues or warnings. Every page preserves totals and scan completeness; no runtime tests or writes.', {
      ...list, view: z.enum(['summary', 'issues', 'warnings']).optional()
    }, playbookValidate]
  ];
  for (const [name, description, inputSchema, handler] of definitions) {
    server.registerTool(name, { description, inputSchema, annotations: READ_ONLY }, async (args) => {
      try {
        const result = await handler({ ...args, target });
        if (!fitsResponse(result)) throw Object.assign(new Error('Response metadata exceeds the transport ceiling. Narrow the query.'), { code: 'aapb.response-too-large' });
        return toolResult(result);
      } catch (error) {
        return toolResult({ kind: 'aapb.error', ok: false, writes: false, code: error.code ?? 'aapb.request-failed', message: String(error.message).slice(0, 1024) });
      }
    });
  }
}
