#!/usr/bin/env node

import {
  isDirectCli,
  runContextHook,
  runContextHookCli
} from '../shared/context-hook.mjs';

const ALLOWED_EVENTS = ['SessionStart', 'PostCompact'];

export async function runClaudeCodeHook(input, options = {}) {
  return runContextHook(input, {
    ...options,
    allowedEvents: ALLOWED_EVENTS,
    label: 'claude-code'
  });
}

if (isDirectCli(import.meta.url)) {
  await runContextHookCli({
    runner: runClaudeCodeHook,
    allowedEvents: ALLOWED_EVENTS,
    label: 'claude-code'
  });
}
