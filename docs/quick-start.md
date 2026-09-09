# First 10 Minutes

Start with a disposable project: create a current-state record, edit it, search it, and check it. Install reusable skills afterward if you want them. MCP and Python are optional.

## Know the four parts

| Part | Meaning | Location |
| --- | --- | --- |
| CLI package | The program that provides `ai-agent-playbook` and its alias `aapb` | A source checkout, npm installation, or npm cache |
| Skills | Reusable task guidance for an agent | User-level `.agents/skills` by default |
| Project records | Current goals, decisions, and evidence | One project's `.ai-agent-playbook/` |
| MCP connection | Lets an agent app call record tools | The app's optional server configuration |

Package installation does not install skills, create records, or register MCP. The records also work with your usual editor and agent.

## 1. Install the CLI with npm

You need Node.js 18 or later and npm. A source checkout and PowerShell installer are not required for ordinary use.

```sh
npm install -g ai-agent-playbook
ai-agent-playbook --version
ai-agent-playbook --help
```

The global installation provides `ai-agent-playbook` and its short alias `aapb`. Both accept the same commands and options. Help lists the available record, skill, and optional commands. For occasional use without a global installation, use `npx ai-agent-playbook` in place of `ai-agent-playbook`.

For a pinned version or isolated installation, follow [Installation and recovery](lifecycle.md). Use the [source/local archive demonstration](demo.md) for unpublished candidate features rather than assuming npm has published this checkout. Continue in a parent folder where you can create a new practice directory.

## 2. Preview records in a practice folder

Use a new, empty directory. If `aapb-demo` already exists, choose another name throughout these examples.

```sh
mkdir aapb-demo
cd aapb-demo
ai-agent-playbook records status --json
ai-agent-playbook bootstrap --records minimal --exclude none --lang en --dry-run --json
```

Status reports a missing playbook, which is normal for a new folder. This exercise uses explicit minimal settings; the preview lists the entrypoint and metadata without creating them.

Bare interactive `bootstrap` opens the guided alternative. After choosing a language and one project or several repositories, a new setup shows the folder-preparation step. Confirm the project folder, or prepare child repositories inside a workspace's parent folder yourself. You can place or clone them in another terminal, then choose Ready to continue or rescan. AAPB creates the record folder after final apply; it does not move or clone repositories.

The guide shows recommended and current settings separately. It recommends standard guides, preservation of agent instructions, and local exclusion with Git or no exclusion outside Git. Nothing is selected automatically: use a number or arrow keys and Enter; repository checkboxes use Space and Enter. `q` and key help are above the list. Outside search input, Esc or `b` goes back when available. Final review lets you change a setting before applying. See [Commands](commands.md) for search, page toggles, and line-input fallback.

Interactive completion shows a readable result and next action. `--yes` still uses saved settings or the existing standard/local-or-none defaults without asking, with explicit options taking precedence. Explicit argument and non-interactive calls retain their minimal/no-exclusion defaults; `--json` never asks and keeps structured output.

These commands use the current terminal directory. An explicit `.` means the same thing. A path or `--project "<project>"` selects another folder. Registered workspace members can use their ancestor common records; otherwise record discovery stays at the selected directory. Checking the containing Git worktree for exclusions is separate and does not move the record location.

## 3. Create and edit a current-state record

```sh
ai-agent-playbook bootstrap --records minimal --exclude none --lang en --json
ai-agent-playbook records read --path CURRENT.md
```

The apply call creates `.ai-agent-playbook/` automatically; you do not need to create that folder yourself. With this exercise's minimal settings, the project now contains:

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
ai-agent-playbook records status --json
ai-agent-playbook records read --path CURRENT.md
ai-agent-playbook records search --query "practice folder" --json
ai-agent-playbook records validate --json
```

- Status should identify `CURRENT.md` as the entrypoint and `minimal` as the layout.
- Read should return the saved text.
- Search should return its path, a line number, and surrounding text.
- Validation describes document checks. `runtimeVerified: false` is expected; no application tests were run.

Inspect warnings and `scan.complete` as well as `ok`. If a result has a cursor, follow [the continuation examples](record-responses.md) to read the rest.

## 5. Install reusable skills when needed

The practice above works without user-level skills. To add AAPB guidance to your agent, preview development-profile installation:

```sh
ai-agent-playbook skills list --json
ai-agent-playbook skills install --profile development --dry-run --json
```

The target is your user skill directory, not the practice project. Development selects five skills for records, artifact formats, design, UI, and document editing. Inspect any conflicts, then apply:

```sh
ai-agent-playbook skills install --profile development --json
ai-agent-playbook skills check --profile development --json
```

Reload your agent's skills or start a fresh session. Confirm the names in [the catalog](skill-catalog.md). If 0.5 copies remain in two folders, follow [the separate migration procedure](lifecycle.md); normal installation does not remove them.

## 6. Use an existing project

Replace `<project>` with its actual folder. Quote paths containing spaces; do not type the placeholder itself.

```sh
ai-agent-playbook records status "<project>" --json
ai-agent-playbook bootstrap "<project>" --local-only --dry-run
```

`--local-only` aliases `--exclude local` and requests a rule in Git's `info/exclude`. AAPB checks the Git repository containing the setup root, so a nested project folder does not need its own `.git` directory and linked worktrees are supported. They may share the exclude file. Outside Git, an explicit local request skips exclusion with a warning; the guide shows the local choice disabled with a reason. Records remain usable. Use `--exclude none` when no new ignore rule is wanted, `shared` for a shared ignore rule, or `global` for a user-level rule. No mode creates a commit or initializes Git.

If records already exist, read their entrypoint. Bootstrap preserves them and existing root instructions; `--records standard` can add missing guides, and `--agents link` can add a short records link when explicitly selected. If no records exist and the preview is right, repeat without `--dry-run`. Read [Existing repositories](existing-repository-bootstrap.md) before migrating layouts.

## Common problems

| Symptom | What to check |
| --- | --- |
| `node` or `npm` not found | Install Node.js, reopen the terminal, check `node --version` and `npm --version` |
| A local Node script cannot be found | Check the absolute package path used by the isolated installation |
| `ai-agent-playbook` not found | Check the version: 0.5.11 provides only `aapb`. For 1.0, reopen the terminal after npm global installation; check the npm prefix and PATH, or use the isolated Node entrypoint |
| Local exclusion is disabled in the guide or skipped outside Git | Read the reason or warning. Records remain usable; `none` adds no ignore rule, and no Git initialization is needed |
| Enter does not advance a single-choice menu | Choose an item with a number or arrow keys first; recommended/current markers do not select it |
| Skills absent in the agent | Check profile, installation result, supported path, and a fresh session's catalog |
| Old skill conflicts | Preserve it and inspect migration; force-replacement flags are unsupported |
| Modified managed files | Review local edits; do not overwrite useful records merely to clear the signal |

## Glossary and next steps

| Term | Meaning |
| --- | --- |
| `ai-agent-playbook` / `aapb` | Primary executable / short alias supplied by the same package |
| `npx` | Runs an npm package, possibly a different version from a checkout or global installation |
| `bootstrap` | Creates missing records or applies selected guides, links, and exclusion changes while preserving existing content |
| `--dry-run` | Shows proposed operations without writing |
| `--apply` | Applies workspace changes, migration, rollback, or Forge operations that otherwise preview |
| `--json` | Retains structured warnings and continuation fields |
| Cursor | A returned value pointing to the next part of the result; copy it unchanged |

For several repositories, continue with [Workspaces](workspaces.md). For milestone logs and reusable knowledge, use [Durable records](durable-records.md).

Continue with [Commands](commands.md), [Installation and recovery](lifecycle.md), or [MCP setup](mcp-permission-model.md). All guides are listed in the [documentation map](README.md).
