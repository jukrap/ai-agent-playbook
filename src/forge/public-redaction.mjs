const SENSITIVE_NAME = '(?:access[-_]?token|token|secret|password|passwd|authorization|auth|api[-_]?key|client[-_]?secret|private[-_]?key|x[-_]?api[-_]?key)';
const EXACT_OPTION = new RegExp(`^--?${SENSITIVE_NAME}$`, 'i');
const INLINE_OPTION = new RegExp(`^(--?${SENSITIVE_NAME}=).+$`, 'i');
const ENV_ASSIGNMENT = new RegExp(`^([A-Za-z_][A-Za-z0-9_]*${SENSITIVE_NAME}[A-Za-z0-9_]*=).+$`, 'i');
const HEADER_NAME = /^(?:authorization|proxy-authorization|x-api-key|private-token|x-auth-token)\s*:?$/i;
const HEADER_VALUE = /^((?:authorization|proxy-authorization|x-api-key|private-token|x-auth-token)\s*:\s*).+$/i;

export function redactPublicArgv(argv) {
  let redactNext = false;
  return (Array.isArray(argv) ? argv : []).map((value) => {
    const item = String(value);
    if (redactNext) {
      redactNext = false;
      return '[REDACTED]';
    }
    if (EXACT_OPTION.test(item) || HEADER_NAME.test(item)) {
      redactNext = true;
      return item;
    }
    return item
      .replace(INLINE_OPTION, '$1[REDACTED]')
      .replace(ENV_ASSIGNMENT, '$1[REDACTED]')
      .replace(HEADER_VALUE, '$1[REDACTED]')
      .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi, '$1 [REDACTED]')
      .replace(/\b(?:gh[pousr]_|github_pat_|glpat-|sk-)[A-Za-z0-9_-]{8,}\b/g, '[REDACTED]')
      .replace(/(https?:\/\/)[^/@\s]+@/gi, '$1[REDACTED]@');
  });
}
