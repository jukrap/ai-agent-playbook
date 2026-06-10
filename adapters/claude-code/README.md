# Claude Code adapter

Claude Code can use this repository at two levels:

- the portable document harness in project `AGENTS.md` and `ai-playbook/`;
- optional Claude Code hooks or skills that call the same local CLI.

The default path is still the document and CLI harness. Do not require Claude Code hooks, plugins, or user-level settings for a project to use this playbook.

## Runtime CLI

Run the CLI from this repository checkout:

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-repo> --dry-run
node .\bin\ai-playbook.mjs guides sync <target-repo> --check
node .\bin\ai-playbook.mjs doctor <target-repo> --json
node .\bin\ai-playbook.mjs context <target-repo> --json
```

`context` reads only these project playbook files:

- `ai-playbook/START_HERE.md`
- `ai-playbook/CURRENT.md`
- `ai-playbook/SKILLS.md`
- `ai-playbook/GIT.md`

It does not re-inject root `AGENTS.md` by default.

## Optional context hook PoC

`hook.mjs` is a read-only proof of concept for Claude Code hook environments. It reads the hook payload from stdin, uses the payload `cwd` as the target project, and emits `hookSpecificOutput.additionalContext` for:

- `SessionStart`
- `PostCompact`

The hook does not install itself, edit project files, rewrite tool output, or call the network. If `ai-playbook/` is missing, unsupported, or unreadable, it exits successfully with no stdout.

Use `settings.example.json` only as a manual starting point. Replace `<path-to-ai-agent-playbook>` with this checkout path in a local Claude Code settings file. Keep the timeout short and keep debug output on stderr by setting `AI_PLAYBOOK_DEBUG=1` only while troubleshooting.

## Skills and commands

Claude Code can load skills from project, personal, or plugin locations. This repository does not currently install Claude Code-specific skill wrappers. The reusable skills remain under `skills/`, and this adapter should stay a thin bridge unless a later change adds a dedicated Claude Code packaging path.

## Source rule

Keep project policy in `ai-playbook/` and reusable source content in this repository. Treat Claude Code hooks and skills as optional runtime conveniences, not the only place where project memory exists.
