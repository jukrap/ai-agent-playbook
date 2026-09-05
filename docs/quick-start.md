# First 10 Minutes

Start with a disposable project: create a current-state record, edit it, search it, and check it. Install reusable skills afterward if you want them. MCP and Python are optional.

## Know the four parts

| Part | Meaning | Location |
| --- | --- | --- |
| CLI package | The program that provides `aapb` | A source checkout, npm installation, or npm cache |
| Skills | Reusable task guidance for an agent | User-level `.agents/skills` by default |
| Project records | Current goals, decisions, and evidence | One project's `.ai-agent-playbook/` |
| MCP connection | Lets an agent app call record tools | The app's optional server configuration |

Package installation does not install skills, create records, or register MCP. The records also work with your usual editor and agent.

## 1. Install the CLI with npm

You need Node.js 18 or later and npm. A source checkout and PowerShell installer are not required for ordinary use.

```sh
npm install -g ai-agent-playbook
aapb --version
aapb --help
```

The global installation makes `aapb` available in a normal terminal. Help lists the available record, skill, and optional commands. For occasional use without a global installation, use `npx ai-agent-playbook` in place of `aapb`.

For a pinned version or isolated installation, follow [Installation and recovery](lifecycle.md). Continue in a parent folder where you can create a new practice directory.

## 2. Preview records in a practice folder

Use a new, empty directory. If `aapb-demo` already exists, choose another name throughout these examples.

```sh
mkdir aapb-demo
cd aapb-demo
aapb records status . --json
aapb bootstrap . --dry-run
```

Status reports a missing playbook, which is normal for a new folder. Preview lists three planned files without creating them.

## 3. Create and edit a current-state record

```sh
aapb bootstrap .
aapb records read . --path CURRENT.md
```

The project now contains:

```text
aapb-demo/
  .ai-agent-playbook/
    CURRENT.md                        Edit this document
    manifest.json                     Layout metadata
    .ai-agent-playbook-install.json    Ownership and integrity metadata
```

Open `.ai-agent-playbook/CURRENT.md` in your editor and replace its prompts with actual content:

```markdown
# Current state

## Objective
Try AAPB record reading and search.

## Constraints
Use only this disposable practice folder.

## Verified state
Bootstrap created the records. Application tests have not been run.

## Next action
Search for "practice folder" and inspect validation output.
```

`CURRENT.md` is meant to be edited. Leave the metadata files to the CLI. No separate specification or worklog is needed for this exercise.

## 4. Read, search, and validate

```sh
aapb records status . --json
aapb records read . --path CURRENT.md
aapb records search . --query "practice folder" --json
aapb records validate . --json
```

- Status should identify `CURRENT.md` as the entrypoint and `minimal` as the layout.
- Read should return the saved text.
- Search should return its path, a line number, and surrounding text.
- Validation describes document checks. `runtimeVerified: false` is expected; no application tests were run.

Inspect warnings and `scan.complete` as well as `ok`. If a result has a cursor, follow [the continuation examples](record-responses.md) to read the rest.

## 5. Install reusable skills when needed

The practice above works without user-level skills. To add AAPB guidance to your agent, preview development-profile installation:

```sh
aapb skills list --json
aapb skills install --profile development --dry-run --json
```

The target is your user skill directory, not the practice project. Development selects five skills for records, artifact formats, design, UI, and document editing. Inspect any conflicts, then apply:

```sh
aapb skills install --profile development --json
aapb skills check --profile development --json
```

Reload your agent's skills or start a fresh session. Confirm the names in [the catalog](skill-catalog.md). If 0.5 copies remain in two folders, follow [the separate migration procedure](lifecycle.md); normal installation does not remove them.

## 6. Use an existing project

Replace `<project>` with its actual folder. Quote paths containing spaces; do not type the placeholder itself.

```sh
aapb records status "<project>" --json
aapb bootstrap "<project>" --local-only --dry-run
```

`--local-only` requires a Git repository. For a new playbook, it adds the records to Git's local exclude file. Omit it for a non-Git folder or when records should be available for committing. Neither mode creates a commit.

If records already exist, read their entrypoint. Bootstrap preserves them and existing root instructions. If no records exist and the preview is right, repeat without `--dry-run`. Read [Existing repositories](existing-repository-bootstrap.md) before migrating layouts.

## Common problems

| Symptom | What to check |
| --- | --- |
| `node` or `npm` not found | Install Node.js, reopen the terminal, check `node --version` and `npm --version` |
| A local Node script cannot be found | Check the absolute package path used by the isolated installation |
| `aapb` not found | Reopen the terminal after npm global installation; check the npm prefix and PATH, or use the isolated Node entrypoint |
| `--local-only` fails outside Git | Omit it for the practice folder; use it only in a Git repository |
| Skills absent in the agent | Check profile, installation result, supported path, and a fresh session's catalog |
| Old skill conflicts | Preserve it and inspect migration; force-replacement flags are unsupported |
| Modified managed files | Review local edits; do not overwrite useful records merely to clear the signal |

## Glossary and next steps

| Term | Meaning |
| --- | --- |
| `aapb` | Executable supplied by the `ai-agent-playbook` package |
| `npx` | Runs an npm package, possibly a different version from a checkout or global installation |
| `bootstrap` | Creates a playbook only when none exists |
| `--dry-run` | Shows proposed operations without writing |
| `--apply` | Applies migration, rollback, or Forge operations that otherwise preview |
| `--json` | Retains structured warnings and continuation fields |
| Cursor | A returned value pointing to the next part of the result; copy it unchanged |

Continue with [Commands](commands.md), [Installation and recovery](lifecycle.md), or [MCP setup](mcp-permission-model.md). All guides are listed in the [documentation map](README.md).
