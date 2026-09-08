import { z } from 'zod';
import { playbookStatus, playbookSearch, playbookRead, playbookValidate, RECORD_TOOLS } from './records.mjs';
import { toolResult, fitsResponse, MAX_CONTENT_CHARS, MAX_MCP_RESULT_BYTES } from './record-paging.mjs';

export { RECORD_TOOLS, MAX_MCP_RESULT_BYTES };
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const budget = { maxChars: z.number().int().min(1).max(MAX_CONTENT_CHARS).optional(), cursor: z.string().min(1).max(2048).optional() };
const list = { ...budget, pageSize: z.number().int().min(1).max(100).optional() };
const source = { recordSource: z.string().max(70).describe('workspace (default) or repo:<registered-id> for existing member records.').optional() };
export function registerPlaybookMcpTools(server, { target }) {
  /** @type {Array<[string, string, Record<string, z.ZodTypeAny>, (args: any) => Promise<any>]>} */
  const definitions = [
    ['aapb_status', 'Summarize project records. Select records or warnings view for paged details; repeat the view with cursor.', {
      ...list, ...source, view: z.enum(['summary', 'records', 'warnings', 'repositories']).optional()
    }, playbookStatus],
    ['aapb_search', 'Search literal record text with source locations and continuation. Repeat query/view with cursor; changed sources require a restart.', {
      ...budget, ...source, query: z.string().min(1).max(1000), maxResults: z.number().int().min(1).max(100).optional(), view: z.enum(['results', 'warnings']).optional(),
      path: z.string().min(1).max(1024).describe('Record file or directory prefix to inspect before reading text.').optional(),
      repo: z.string().max(64).optional(), month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(), kind: z.enum(['worklog', 'knowledge', 'current', 'other']).optional()
    }, playbookSearch],
    ['aapb_read', 'Read exact text from the bound playbook; omit path to read CURRENT.md. Paths are relative to the playbook folder, not the project. Continue with the same path and cursor, without line arguments; source changes reject the cursor.', {
      ...budget, ...source, path: z.string().min(1).max(1024).describe('Record path such as CURRENT.md or memory/decisions/example.md. Do not prefix the playbook folder name (for example .ai-agent-playbook/) or an absolute project path. Defaults to CURRENT.md.').optional(), startLine: z.number().int().min(1).max(1000000).optional(), endLine: z.number().int().min(1).max(1000000).optional()
    }, playbookRead],
    ['aapb_validate', 'Validate record JSON, links and ownership with paged issues or warnings. Every page preserves totals and scan completeness; no runtime tests or writes.', {
      ...list, ...source, view: z.enum(['summary', 'issues', 'warnings']).optional()
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
