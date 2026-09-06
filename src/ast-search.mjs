import { Worker } from 'node:worker_threads';

export const AST_TOOL = 'aapb_ast_search';
export const AST_LANGUAGES = ['javascript', 'typescript', 'tsx', 'jsx', 'css', 'html'];
export const AST_LIMITS = Object.freeze({ files: 4000, entries: 20000, fileBytes: 1000000, totalBytes: 32000000, matches: 5000, snippetChars: 500, timeoutMs: 30000 });

/** Run parsing in an isolated worker so a slow native match cannot block MCP.
 * @returns {Promise<any>}
 */
export function searchAst(options) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const worker = new Worker(new URL('./ast-worker.mjs', import.meta.url), {
      workerData: options, execArgv: process.execArgv.filter((arg) => !arg.startsWith('--input-type')),
      resourceLimits: { maxOldGenerationSizeMb: 128 }
    });
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      if (error) reject(error); else resolve(result);
    };
    const timer = setTimeout(() => finish(Object.assign(new Error('AST search exceeded 30 seconds. Narrow path or pattern.'), { code: 'aapb.ast-timeout' })), AST_LIMITS.timeoutMs);
    worker.once('message', ({ error, result }) => finish(error ? Object.assign(new Error(error.message), { code: error.code }) : null, result));
    worker.once('error', (error) => finish(error));
    worker.once('exit', () => finish(new Error('AST search worker stopped before returning a result.')));
  });
}
