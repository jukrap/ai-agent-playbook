import { sha256 } from './fs-safety.mjs';

export const DEFAULT_CONTENT_CHARS = 12000;
export const MAX_CONTENT_CHARS = 100000;
export const MAX_MCP_RESULT_BYTES = 256 * 1024;

export function toolResult(result) {
  return { structuredContent: result, content: [{ type: 'text', text: JSON.stringify(result) }], isError: !result.ok };
}
export function fitsResponse(result) {
  return Buffer.byteLength(JSON.stringify(toolResult(result)), 'utf8') <= MAX_MCP_RESULT_BYTES;
}
export function integerLimit(value, fallback, max) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) throw new Error('Invalid output limit.');
  return parsed;
}
export function pagingError(code, message) { return Object.assign(new Error(message), { code }); }
export const scopeHash = (value) => sha256(JSON.stringify(value));
export function cursorAt(scope, offset, extra = {}) {
  return Buffer.from(JSON.stringify({ v: 1, scope, offset, ...extra })).toString('base64url');
}
export function readCursor(cursor, scope, maximum) {
  if (cursor === undefined) return null;
  let parsed;
  try {
    if (typeof cursor !== 'string' || !/^[A-Za-z0-9_-]{1,2048}$/.test(cursor)) throw new Error();
    parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (parsed?.v !== 1 || parsed.scope !== scope || !Number.isSafeInteger(parsed.offset) || parsed.offset < 0 || parsed.offset > maximum) throw new Error();
  } catch {
    throw pagingError('aapb.cursor-invalid', 'Cursor does not match the project, query or current source. Restart the query without a cursor.');
  }
  return parsed;
}
export function pageItems({ items, key, metadata, scope, cursor, pageSize = 20, maxChars = DEFAULT_CONTENT_CHARS }) {
  const count = integerLimit(pageSize, 20, 100);
  const cap = integerLimit(maxChars, DEFAULT_CONTENT_CHARS, MAX_CONTENT_CHARS);
  const start = readCursor(cursor, scope, items.length)?.offset ?? 0;
  const selected = [];
  const resultAt = (end) => ({ ...metadata, [key]: selected,
    page: { returned: selected.length, totalItems: items.length, nextCursor: end < items.length ? cursorAt(scope, end) : null },
    truncated: end < items.length });
  let end = start;
  while (end < items.length && selected.length < count) {
    selected.push(items[end]);
    if (JSON.stringify(selected).length > cap || !fitsResponse(resultAt(end + 1))) { selected.pop(); break; }
    end++;
  }
  if (end === start && start < items.length) throw pagingError('aapb.page-budget-too-small', 'The page budget cannot hold one complete item. Increase maxChars or narrow the query.');
  const result = resultAt(end);
  if (!fitsResponse(result)) throw pagingError('aapb.response-too-large', 'Response metadata exceeds the transport ceiling. Narrow the query.');
  return result;
}
export function textBoundary(text, end) {
  return end > 0 && end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1]) && /[\uDC00-\uDFFF]/.test(text[end]) ? end - 1 : end;
}
