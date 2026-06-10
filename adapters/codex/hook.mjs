#!/usr/bin/env node

import {
  isDirectCli,
  runContextHook,
  runContextHookCli
} from '../shared/context-hook.mjs';

const ALLOWED_EVENTS = ['SessionStart', 'PostCompact'];

export async function runCodexHook(input, options = {}) {
  return runContextHook(input, {
    ...options,
    allowedEvents: ALLOWED_EVENTS,
    label: 'codex'
  });
}

if (isDirectCli(import.meta.url)) {
  await runContextHookCli({
    runner: runCodexHook,
    allowedEvents: ALLOWED_EVENTS,
    label: 'codex'
  });
}
