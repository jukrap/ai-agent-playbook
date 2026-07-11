import { spawn } from 'node:child_process';

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 1000;
const MAX_BACKOFF_MS = 30_000;
const TRANSIENT_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ETIMEDOUT'
]);

/**
 * Build a transport that never interpolates command arguments into a shell.
 * The runner is injectable so provider adapters can be tested without a CLI.
 *
 * @param {{
 *   runner?: (command: string, args: string[], options: object) => Promise<object>,
 *   sleep?: (milliseconds: number) => Promise<void>,
 *   maxAttempts?: number,
 *   baseDelayMs?: number,
 *   now?: () => number
 * }} [options]
 */
export function createCommandTransport(options = {}) {
  const runner = options.runner ?? runCommand;
  const defaults = {
    maxAttempts: positiveInteger(options.maxAttempts, DEFAULT_MAX_ATTEMPTS),
    baseDelayMs: nonNegativeNumber(options.baseDelayMs, DEFAULT_BASE_DELAY_MS),
    sleep: options.sleep ?? defaultSleep,
    now: options.now ?? Date.now
  };

  return {
    async run(command, args, executionOptions = {}) {
      validateCommand(command, args);
      const {
        maxAttempts = defaults.maxAttempts,
        baseDelayMs = defaults.baseDelayMs,
        ...runnerOptions
      } = executionOptions;
      const processOptions = {
        ...runnerOptions,
        shell: false
      };

      return retryWithBackoff(async () => {
        const result = await runner(command, [...args], processOptions);
        if (isFailedCommandResult(result)) throw commandFailure(command, result);
        return normalizeCommandResult(result);
      }, {
        maxAttempts,
        baseDelayMs,
        sleep: defaults.sleep,
        now: defaults.now
      });
    }
  };
}

/**
 * Retry structured transient failures with deterministic exponential backoff.
 * Retry-After response metadata takes precedence over the calculated delay.
 *
 * @template T
 * @param {(attempt: number) => Promise<T>} operation
 * @param {{
 *   maxAttempts?: number,
 *   baseDelayMs?: number,
 *   sleep?: (milliseconds: number) => Promise<void>,
 *   now?: () => number,
 *   deadlineAt?: number,
 *   signal?: AbortSignal,
 *   shouldRetry?: (error: unknown) => boolean
 * }} [options]
 * @returns {Promise<T>}
 */
export async function retryWithBackoff(operation, options = {}) {
  if (typeof operation !== 'function') throw new TypeError('Retry operation must be a function.');
  const maxAttempts = positiveInteger(options.maxAttempts, DEFAULT_MAX_ATTEMPTS);
  const baseDelayMs = nonNegativeNumber(options.baseDelayMs, DEFAULT_BASE_DELAY_MS);
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? Date.now;
  const shouldRetry = options.shouldRetry ?? isTransientError;
  const deadlineAt = Number(options.deadlineAt);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    assertRetryNotAborted(options.signal);
    assertRetryDeadline(deadlineAt, now, 'before forge request');
    try {
      return await operation(attempt);
    } catch (error) {
      if (attempt >= maxAttempts || !shouldRetry(error)) throw error;
      const responseDelay = retryAfterMilliseconds(error, now);
      const backoff = Math.min(MAX_BACKOFF_MS, baseDelayMs * (2 ** (attempt - 1)));
      const delay = Math.min(MAX_BACKOFF_MS, responseDelay ?? backoff);
      assertRetryDeadline(deadlineAt, now, 'before forge retry backoff', delay);
      await abortableSleep(sleep, delay, options.signal);
    }
  }

  throw new Error('Retry loop exhausted without a result.');
}

function assertRetryNotAborted(signal) {
  if (!signal?.aborted) return;
  throw Object.assign(new Error('Forge retry was aborted.'), {
    name: 'AbortError',
    code: signal.reason?.code ?? 'automation.operation.aborted'
  });
}

async function abortableSleep(sleep, delay, signal) {
  assertRetryNotAborted(signal);
  if (!signal) return sleep(delay);
  let listener;
  const aborted = new Promise((resolve, reject) => {
    listener = () => reject(Object.assign(new Error('Forge retry was aborted during backoff.'), {
      name: 'AbortError',
      code: signal.reason?.code ?? 'automation.operation.aborted'
    }));
    signal.addEventListener('abort', listener, { once: true });
  });
  try {
    return await Promise.race([sleep(delay), aborted]);
  } finally {
    signal.removeEventListener('abort', listener);
  }
}

function assertRetryDeadline(deadlineAt, now, phase, requiredMs = 0) {
  if (!Number.isFinite(deadlineAt)) return;
  if (Number(deadlineAt) - now() > requiredMs) return;
  throw Object.assign(
    new Error(`The tick deadline was exhausted ${phase}.`),
    { code: 'automation.tick.deadline-exceeded' }
  );
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      shell: false,
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => { stdout += chunk; });
    child.stderr?.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      resolve({
        code: code ?? 1,
        signal: signal ?? null,
        stdout,
        stderr
      });
    });
  });
}

function validateCommand(command, args) {
  if (typeof command !== 'string' || !command.trim() || command.includes('\0')) {
    throw new TypeError('Command must be a non-empty string without null bytes.');
  }
  if (!Array.isArray(args) || !args.every((argument) => typeof argument === 'string')) {
    throw new TypeError('Command arguments must be an array of strings.');
  }
}

function isFailedCommandResult(result) {
  return result && typeof result.code === 'number' && result.code !== 0;
}

function normalizeCommandResult(result) {
  const value = result && typeof result === 'object' ? result : {};
  return {
    ...value,
    ok: value.code === undefined || value.code === 0,
    code: value.code ?? 0,
    stdout: typeof value.stdout === 'string' ? value.stdout : '',
    stderr: typeof value.stderr === 'string' ? value.stderr : ''
  };
}

function commandFailure(command, result) {
  const stderr = typeof result?.stderr === 'string' ? result.stderr.trim() : '';
  return Object.assign(
    new Error(stderr || `${command} exited with code ${result?.code ?? 'unknown'}.`),
    {
      name: 'CommandExecutionError',
      result,
      ...(result?.statusCode !== undefined ? { statusCode: result.statusCode } : {}),
      ...(result?.headers !== undefined ? { headers: result.headers } : {}),
      ...(result?.retryAfter !== undefined ? { retryAfter: result.retryAfter } : {})
    }
  );
}

function isTransientError(error) {
  const retryAfter = readRetryAfter(error);
  if (retryAfter !== null) return true;
  const statusCode = numericStatusCode(error);
  if (statusCode === 408 || statusCode === 425 || statusCode === 429 || statusCode >= 500) return true;
  return typeof error?.code === 'string' && TRANSIENT_ERROR_CODES.has(error.code);
}

function numericStatusCode(error) {
  const value = error?.statusCode ?? error?.status ?? error?.result?.statusCode;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function retryAfterMilliseconds(error, now) {
  const value = readRetryAfter(error);
  if (value === null) return null;
  if (/^\d+(?:\.\d+)?$/.test(value)) return Math.max(0, Math.ceil(Number(value) * 1000));
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, timestamp - now());
}

function readRetryAfter(error) {
  const direct = error?.retryAfter ?? error?.result?.retryAfter;
  if (direct !== undefined && direct !== null) return String(direct).trim();
  const headers = error?.headers ?? error?.result?.headers;
  if (!headers) return null;
  if (typeof headers.get === 'function') {
    const value = headers.get('retry-after');
    return value === null || value === undefined ? null : String(value).trim();
  }
  if (typeof headers !== 'object') return null;
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === 'retry-after' && value !== undefined && value !== null) {
      return String(value).trim();
    }
  }
  return null;
}

function positiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function nonNegativeNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function defaultSleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
