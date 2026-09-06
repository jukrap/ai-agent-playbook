import { z } from 'zod';
import { AST_TOOL, AST_LANGUAGES, searchAst } from './ast-search.mjs';
import { toolResult } from './record-paging.mjs';

export function registerAstMcpTool(server, { target }) {
  server.registerTool(AST_TOOL, {
    description: 'Search source syntax in this project with ast-grep. Choose lang and a narrow project-relative path. Returns locations, bounded snippets and cursor pages; scan.complete reports coverage. No rewrites or project commands.',
    inputSchema: {
      pattern: z.string().min(1).max(4096), lang: z.enum(/** @type {[string, ...string[]]} */ (AST_LANGUAGES)),
      path: z.string().min(1).max(1024).optional(), maxFiles: z.number().int().min(1).max(4000).optional(),
      maxResults: z.number().int().min(1).max(100).optional(), maxChars: z.number().int().min(1).max(100000).optional(),
      cursor: z.string().min(1).max(2048).optional()
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, async (args) => {
    try { return toolResult(await searchAst({ ...args, target })); }
    catch (error) { return toolResult({ kind: 'aapb.error', ok: false, writes: false, code: error.code ?? 'aapb.ast-failed', message: String(error.message).slice(0, 1024) }); }
  });
}
