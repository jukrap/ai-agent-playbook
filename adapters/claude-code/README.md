# Claude Code adapter

Claude Code can use this repository at two levels:

- the portable document harness in project `AGENTS.md` and `.ai-agent-playbook/`;
- optional Claude Code hooks or skills that call the same local CLI.

The default path is still the document and CLI harness. Do not require Claude Code hooks, plugins, or user-level settings for a project to use this playbook.

## Runtime CLI

Use `npx ai-agent-playbook` after package publication, `aapb` after a global install, or `node .\bin\aapb.mjs` from a local checkout. For settings that persist adapter hook paths, prefer a global install or local checkout so the rendered hook command points at a stable location.

```powershell
npx ai-agent-playbook bootstrap <target-repo> --dry-run
npx ai-agent-playbook guides sync <target-repo> --check --diff --json
npx ai-agent-playbook migrate path <target-repo> --json
npx ai-agent-playbook doctor <target-repo> --json
npx ai-agent-playbook doctor <target-repo> --reminder --json
npx ai-agent-playbook context <target-repo> --json
npx ai-agent-playbook mcp
npx ai-agent-playbook adapter config <target-repo> --adapter claude-code --json
npx ai-agent-playbook adapter check <target-repo> --adapter claude-code --json
npx ai-agent-playbook adapter check <target-repo> --adapter claude-code --settings <local-settings-path> --json
```

The optional adapter-local package shell exposes the same hook, config, and check path with the Claude Code adapter fixed:

```powershell
node .\adapters\claude-code\package.mjs config <target-repo> --json
node .\adapters\claude-code\package.mjs check <target-repo> --json
node .\adapters\claude-code\package.mjs hook
```

This shell is not installed automatically, does not write settings, and is only a packaging convenience. Prefer the main CLI for the default document harness.

Use MCP when Claude Code or another AI app can call local tools directly. Register `npx ai-agent-playbook mcp` or, after a global install, `aapb mcp` as the local stdio server command. The default MCP surface is read-only; bounded managed-file and forge-coordination writes have separate server opt-ins and still require `apply: true`. MCP is separate from hook setup.

Use `doctor --reminder --json` only as a small read-only local signal for wrappers or scripts. The hook example does not run doctor automatically.

Use `migrate path --json` only as a preview for legacy `ai-playbook/` projects. It is separate from hook setup and does not install or edit Claude Code settings.

`context` reads only these project playbook files:

- `.ai-agent-playbook/START_HERE.md`
- `.ai-agent-playbook/CURRENT.md`
- `.ai-agent-playbook/policy/SKILLS.md`
- `.ai-agent-playbook/policy/GIT.md`

It does not re-inject root `AGENTS.md` by default.

## Optional context hook PoC

`hook.mjs` is a read-only proof of concept for Claude Code hook environments. It reads the hook payload from stdin, uses the payload `cwd` as the target project, and emits `hookSpecificOutput.additionalContext` for:

- `SessionStart`
- `PostCompact`

The hook does not install itself, edit project files, rewrite tool output, or call the network. If `.ai-agent-playbook/` is missing, unsupported, or unreadable, it exits successfully with no stdout.

By default, the hook only handles `SessionStart` and `PostCompact`. To experiment with narrow lifecycle reminders, opt in locally:

```powershell
$env:AI_AGENT_PLAYBOOK_HOOK_EVENTS = 'UserPromptSubmit,PostToolUse,Stop'
```

`UserPromptSubmit` only reminds on commit, push, PR, merge, worklog, or doctor-style intent. `PostToolUse` only reminds after edit-like tool payloads when a changed path can be read. `Stop` only emits a short end-of-session handoff reminder. These events stay quiet for unrelated prompts, missing playbooks, and unsupported payloads; they do not block, continue the session, run doctor, write files, or call the network.

Before wiring the hook into local Claude Code settings, render a local config and inspect it:

```powershell
node .\bin\aapb.mjs adapter config <target-repo> --adapter claude-code --json
```

The renderer is read-only. It prints a hook command and copy-pasteable config using this checkout's absolute hook path, without writing settings files or leaving placeholder paths in the output.

The JSON output also includes an MCP settings example using `npx ai-agent-playbook mcp`, plus a global-install variant using `aapb mcp`. Review and copy it manually if your AI app supports MCP.

Then run the adapter check:

```powershell
node .\bin\aapb.mjs adapter check <target-repo> --adapter claude-code --json
```

Treat any failure as a setup issue to fix in the target project or adapter checkout before enabling the hook. The check is read-only and verifies both supported hook JSON and quiet unsupported paths.

After manually editing a local Claude Code settings file, validate it too:

```powershell
node .\bin\aapb.mjs adapter check <target-repo> --adapter claude-code --settings <local-settings-path> --json
```

Use `settings.example.json` only as a manual reference when the renderer is not enough. Keep the timeout short and keep debug output on stderr by setting `AI_AGENT_PLAYBOOK_DEBUG=1` only while troubleshooting.

## Skills and commands

Claude Code can load skills from project, personal, or plugin locations. This repository does not currently install Claude Code-specific skill wrappers. The reusable skills remain under `skills/`, and this adapter should stay a thin bridge unless a later change adds a dedicated Claude Code packaging path.

## Source rule

Keep project policy in `.ai-agent-playbook/` and reusable source content in this repository. Treat Claude Code hooks and skills as optional runtime conveniences, not the only place where project memory exists.
