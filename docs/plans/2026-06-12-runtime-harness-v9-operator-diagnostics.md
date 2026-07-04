# Runtime Harness V9 Operator Diagnostics

**Goal:** Add explicit, read-only diagnostics that help an operator inspect rules, verification commands, and terminal layout issues before considering stronger runtime automation.

**Architecture:** Keep the document and CLI harness as the default path. Add small CLI commands that read local project files and return structured JSON. These commands do not install hooks, run project verification commands, write files, or call the network.

## Scope

- Add `rules check <target> [--path <file>] [--json]`.
- Add `diagnostics check <target> [--json]`.
- Add `qa tui-check <capture-file> [--cols N] [--json]`.
- Keep all checks no-write.
- Keep runtime hooks unchanged.
- Document the commands in source docs and Korean translations.

## Rule Matching

`rules check` discovers portable rule sources and reports whether each rule applies to a path.

Initial sources:

- `.ai-agent-playbook/rules/**/*.md`
- `.github/instructions/**/*.md`
- `.cursor/rules/**/*.md`
- `.claude/rules/**/*.md`
- `.github/copilot-instructions.md`
- `CONTEXT.md`

Root `AGENTS.md` is intentionally excluded because supported agents usually load it natively. Directory rules support simple frontmatter: `alwaysApply: true`, `globs: ["src/**/*.ts"]`, and YAML list-style `globs`.

## Diagnostics Discovery

`diagnostics check` reads project metadata and lists likely local verification commands without executing them.

Initial command candidates:

- common `package.json` scripts: `check`, `test`, `test:run`, `lint`, `typecheck`, `build`
- package manager lockfiles: `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, and Bun lockfiles for command rendering
- Python markers in `pyproject.toml`
- Rust `Cargo.toml`
- Go `go.mod`

Missing command candidates warn but do not fail, because some projects keep verification in runbooks or CI.

## TUI QA

`qa tui-check` reads a terminal capture and reports:

- line widths
- max width
- overflow lines
- CJK wide-character columns
- ANSI presence
- simple box-drawing border width mismatch

The command exits non-zero when overflow or border misalignment is found. It is intended for CLI tables, terminal UIs, generated terminal reports, and CJK text layout checks.

## Tests

- Rule matching with spaces and non-ASCII target paths.
- Rule matching excludes root `AGENTS.md`.
- Malformed rule frontmatter produces a warning without failing the command.
- Diagnostics command discovery reads local metadata without running commands.
- Missing diagnostics commands warn without failing.
- TUI check reports CJK width and overflow without writing files.

## Non-goals

- No blocking hooks.
- No continuation.
- No automatic doctor execution.
- No automatic LSP server management.
- No browser screenshot diff in this slice.
- No settings writes.
- No network calls.

## Verification

Run:

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
git diff --check
```

Also run public documentation searches for external harness names and fixed local absolute paths before merge.
