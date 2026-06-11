#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runClaudeCodeHook } from './hook.mjs';
import {
  isDirectAdapterShellCli,
  runAdapterShell
} from '../shared/package-shell.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function runClaudeCodeAdapterShell(argv, io = {}) {
  return runAdapterShell(argv, io, {
    adapter: 'claude-code',
    repoRoot,
    runner: runClaudeCodeHook
  });
}

if (isDirectAdapterShellCli(import.meta.url)) {
  await runClaudeCodeAdapterShell(process.argv.slice(2));
}
