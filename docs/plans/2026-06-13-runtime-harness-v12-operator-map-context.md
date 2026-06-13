# Runtime Harness V12 Operator Map + Context Preview

**Goal:** Add two explicit read-only operator commands that help a human or agent decide what to inspect before loading more context or planning work.

**Architecture:** `operator context` previews path-scoped playbook context, matching rules, and related maps/runbooks without injecting context or writing files. `operator map` summarizes stack, architecture, quality, and concern signals from local files without creating durable map documents.

## Scope

- Add `operator context <target> --path <file> [--json]`.
- Add `operator map <target> [--json]`.
- Keep both commands dependency-free, local-only, no-network, and no-write.
- Reuse existing rule frontmatter parsing for path-scoped context matching.
- Keep `operator check` behavior unchanged.
- Update runtime docs, install docs, target-project guides, roadmap docs, tests, and Korean translations.

## Non-Goals

- No hook installation or automatic context injection.
- No slash commands or plugin packaging.
- No background analysis refresh.
- No generated `.ai-playbook/maps/` output.
- No blocking feedback, continuation, or automatic doctor execution.

## Interfaces

```powershell
node .\bin\ai-playbook.mjs operator context <target> --path src/example.ts --json
node .\bin\ai-playbook.mjs operator map <target> --json
```

`operator context --json` returns:

```json
{
  "schemaVersion": "1",
  "ok": true,
  "target": "<absolute target>",
  "path": "src/example.ts",
  "summary": {},
  "coreSources": [],
  "contexts": [],
  "rules": {},
  "related": [],
  "warnings": []
}
```

`operator map --json` returns:

```json
{
  "schemaVersion": "1",
  "ok": true,
  "target": "<absolute target>",
  "summary": {},
  "stack": {},
  "architecture": {},
  "quality": {},
  "concerns": {},
  "warnings": []
}
```

## Tests

- Add failing tests first for both new commands.
- Include Windows-style path handling through path normalization, spaces, and non-ASCII fixture paths.
- Verify `operator context` reports matching and non-matching `.ai-playbook/context` files, matching rules, and related maps/runbooks.
- Verify `operator map` reports package manager, frameworks, language counts, entrypoints, module boundaries, test files, configs, commands, TODO/debug/security signals, and ignored dependency directories.
- Verify both commands are no-write by comparing file lists before and after execution.
- Run the full CLI test suite and repository validation commands.

## Follow-Up Candidates

- Add a read-only quality debt audit command if `operator map` proves useful in real projects.
- Improve managed catalog and uninstall UX if users need clearer ownership and deletion previews.
