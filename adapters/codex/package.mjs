#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCodexHook } from './hook.mjs';
import {
  isDirectAdapterShellCli,
  runAdapterShell
} from '../shared/package-shell.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function runCodexAdapterShell(argv, io = {}) {
  return runAdapterShell(argv, io, {
    adapter: 'codex',
    repoRoot,
    runner: runCodexHook
  });
}

if (isDirectAdapterShellCli(import.meta.url)) {
  await runCodexAdapterShell(process.argv.slice(2));
}
