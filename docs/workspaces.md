# Share records across repositories

A workspace keeps common project records above explicitly registered member directories. It can include web, service, Android, and iOS repositories without moving their code or existing records. The workspace folder itself does not need Git.

## Choose the members

For example, an existing project folder might contain:

```text
product/
  apps/web/
  services/api/
  mobile/android/
  notes/
```

Run `ai-agent-playbook bootstrap` in `product/` from an interactive terminal and choose workspace mode. The guide discovers a bounded set of repository candidates; select the intended IDs explicitly. Discovery does not register every child folder, scan the whole drive, or follow links and junctions. A non-Git member can be selected by an explicit path using argument mode.

For a repeatable setup, preview the existing relative member directories:

```sh
ai-agent-playbook bootstrap --kind workspace --repo-path apps/web --repo-path services/api --records standard --exclude none --agents link --lang en --dry-run --json
ai-agent-playbook bootstrap --kind workspace --repo-path apps/web --repo-path services/api --records standard --exclude none --agents link --lang en --json
ai-agent-playbook workspace list --json
ai-agent-playbook workspace check --json
```

Repeat `--repo-path` for each selected directory; bootstrap derives IDs from their directory names and reports the registration. In this example the IDs are `web` and `api`. Inspect the result instead of guessing IDs when names repeat. Bootstrap does not use `--repo` for member selection. `--agents link` adds a short records link while preserving existing instructions; choose `preserve` to leave AGENTS.md exactly as it is.

The registry is `.ai-agent-playbook/workspace.json`. It records each member's ID, workspace-relative path, role, and existing local record location when present. An unrelated folder such as `notes/` does not become a member merely because it is below the workspace. Existing membership is preserved when bootstrap runs again; use the management commands to change it.

## Manage membership

```sh
ai-agent-playbook workspace add --id android --path mobile/android --role mobile --json
ai-agent-playbook workspace add --id android --path mobile/android --role mobile --apply --json
ai-agent-playbook workspace remove --id android --json
ai-agent-playbook workspace remove --id android --apply --json
```

`list` and `check` are read-only. `add` and `remove` preview unless `--apply` is present; `--dry-run` keeps an apply request read-only. Use a unique lowercase hyphenated ID and an existing directory inside the workspace. An applied change returns a backup of the prior registry. Keep it and inspect later membership changes before any deliberate restoration. Removing registration does not delete the repository or its records.

`workspace list` reports availability and warnings; `workspace check` fails for unavailable registered members. Correct moved paths deliberately, preserving local records and user edits. Links, junctions, overlapping members, and paths outside the workspace are not a way to extend membership.

## Select records separately from code

Starting at the workspace root or within a registered member resolves the common records by default. AAPB checks explicit registration while looking for an ancestor workspace; it does not treat every ancestor playbook as a project root.

```sh
ai-agent-playbook records status --view repositories --json
ai-agent-playbook records read --path CURRENT.md --record-source workspace --json
ai-agent-playbook records read --path CURRENT.md --record-source repo:web --json
```

`--record-source repo:web` selects that registered member's existing local playbook. It does not create, relocate, merge, or summarize old records. `workspace` selects the common source. A member without local records cannot supply that source. Record migration and recovery also accept `--record-source repo:<id>`; repeat it on `migrate layout`, `migrate rollback`, and `migrate bootstrap-rollback` to limit changes to those local records. See [Lifecycle](lifecycle.md). Without a registered workspace, the existing exact-directory playbook discovery remains available.

For record search, `--repo web` filters records for that member within the chosen source. It recognizes repository metadata, records under `repos/web/`, or an explicitly selected `repo:web` source, and excludes other repository directories before reading their text. It is different from `--record-source repo:web`, which changes the source. Legacy records without repository metadata may not match that filter; read them explicitly before claiming no evidence exists. See [Durable records](durable-records.md) and [Response limits](record-responses.md).

## Select the repository for code and Git

At a workspace root, AST and Forge require `--repo <id>`. Within a registered member, that member is the default code target; an explicit ID can select another registered member. Check the selected repository's instructions, Git root, branch, dirty changes, and remote before code or Git operations.

```sh
ai-agent-playbook ast search --repo web --lang tsx --pattern 'useState($VALUE)' --path src --json
ai-agent-playbook forge status --repo api --json
```

AST paths and Forge plan paths are relative to the selected repository. Its Git exclusions govern source selection. No command applies remote changes to all members just because their records are shared. Android/iOS membership and records do not add Kotlin or Swift to the [supported AST languages](ast-search.md).

In MCP, use `recordSource` on the four record tools, `view: "repositories"` for status, and `repo` on optional `aapb_ast_search`. These choices stay inside the registered workspace; they do not retarget the server to an arbitrary directory. See [MCP setup](mcp-permission-model.md).

## Exclusions and recovery

Choose `local`, `shared`, `global`, or `none` for the location of the records. A common record folder outside a child Git repository does not need an ignore rule in that child. `shared` shares an ignore rule, not the record contents; `none` adds no rule. Existing tracked files remain tracked.

Keep returned backups when changing exclusions or adding an AGENTS link. [Existing repositories](existing-repository-bootstrap.md) explains the modes; [Lifecycle](lifecycle.md) covers `migrate bootstrap-rollback`. Registry backups and bootstrap recovery journals serve different operations. Preserve both and do not use a bootstrap rollback command with a workspace registry backup.
