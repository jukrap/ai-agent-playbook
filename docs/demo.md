# Test a local package before publication

A registry upload is not needed to test the files npm would ship. Pack a verified checkout, install the archive in a fresh prefix, and use that exact installation. Keep its checksum and results so the later release decision refers to a concrete artifact.

## 1. Install into a separate prefix

From the AAPB checkout, run `npm pack`. Replace the placeholders below with a new demonstration directory and the returned archive path. This PowerShell example creates variables only for the current terminal session.

```powershell
npm pack
$demoPrefix = '<absolute-demo-prefix>'
$demoArchive = '<absolute-archive.tgz>'
npm install --prefix $demoPrefix --ignore-scripts $demoArchive
$demoCli = Join-Path $demoPrefix 'node_modules/ai-agent-playbook/bin/aapb.mjs'
node $demoCli --version
node $demoCli --help
```

Confirm the installed version against the checkout's package.json, currently `1.2.1`. Registry tags describe published packages; they do not automatically follow a source version change. Use the verified local archive or `node bin/aapb.mjs` from source until the intended release is available in the registry. Package installation does not install user skills or enable MCP. All following calls use `node $demoCli` so a different global version cannot accidentally supply the result. In another shell, invoke the installed script by its absolute path.

## 2. Inspect an existing project without changing it

Choose the project and preserve its initial Git state and record-file hashes in your approved local evidence directory. Do not put private paths or raw reports in public release files.

```powershell
$demoProject = '<absolute-project-directory>'
node $demoCli records status $demoProject --json
node $demoCli records status $demoProject --view records --page-size 7 --json
node $demoCli records read $demoProject --path CURRENT.md --max-chars 700 --json
node $demoCli records search $demoProject --query '<phrase-in-the-records>' --max-results 2 --json
node $demoCli records validate $demoProject --page-size 4 --json
node $demoCli migrate layout $demoProject --to minimal --json
```

Check entrypoint, totals, source locations, warnings, and `scan.complete`. A small read budget is deliberate here: it exercises continuation, not a recommended size for every ordinary call. Use the returned `nextCursor` for reads or `page.nextCursor` for lists as shown in [Response limits](record-responses.md).

Concatenate read `content` without separators and compare it with source text. UTF-8 BOM removal affects text output only; hashes identify original bytes. A `managed-modified` signal identifies customization to inspect, not a prose defect. Missing ownership may legitimately prevent migration without preventing reads.

Recheck original hashes and Git state after the read/preview sequence. Run the project's own lint, test, or build separately if application behavior is part of the demonstration. Record validation never sets `runtimeVerified` to true.

## 3. Test migration on preserved copies

Use a copied record set in a separate project folder for apply/rollback. Keep the original untouched. Preview the copy, apply only if ownership checks permit it, retain the returned relative backup path, and preview/apply rollback. Compare every original copied record after recovery; the recovery archive intentionally remains.

If migration is refused because metadata is modified or unowned, record the refusal and keep reading. Do not manufacture ownership merely to produce a successful demonstration. [Lifecycle](lifecycle.md) provides the exact commands.

## 4. Exercise MCP and selected installation

Use an SDK stdio client or the selected host to start the installed script with `mcp --project <project>`. List and call `aapb_status`, `aapb_search`, `aapb_read`, and `aapb_validate`; verify the text and unchanged source files. An SDK round trip verifies server/transport behavior, not every host's rendering or token accounting. A common MCP entry does not need to be enabled for an ephemeral SDK test.

For skill lifecycle testing, use a separate destination and legacy root, both outside your real installation:

```powershell
node $demoCli skills install --profile development --agents-root '<demo-skills>' --codex-root '<empty-legacy-root>' --dry-run --json
```

Apply by omitting `--dry-run`, then check, uninstall, and recover using the same selection and returned backup. Keep backups outside both roots and on the same filesystem. [Installation guidance](lifecycle.md) explains partial failures and reverse transaction order.

## Workspace and durable-record exercise

Use a fresh disposable workspace with existing member folders such as `apps/web` and `services/api`. Give the CLI that workspace as its project path; keep real repositories read-only. From the workspace root, the equivalent installed commands are:

```sh
ai-agent-playbook bootstrap --kind workspace --repo-path apps/web --repo-path services/api --records standard --exclude none --agents link --dry-run --json
ai-agent-playbook bootstrap --kind workspace --repo-path apps/web --repo-path services/api --records standard --exclude none --agents link --json
ai-agent-playbook records status --view repositories --json
ai-agent-playbook worklog new --title "Workspace setup" --topic setup --repo web --lang en --json
ai-agent-playbook knowledge new --title "Workspace contract" --topic setup --repo web --lang en --json
ai-agent-playbook worklog list --repo web --topic setup --page-size 5 --json
ai-agent-playbook records search --query "Workspace" --repo web --kind knowledge --json
```

In the PowerShell session above, substitute `node $demoCli` for `ai-agent-playbook` and supply the disposable workspace path. Fill the created records from actual results. Re-run status from a registered member and check that it resolves common records; compare an unregistered sibling. If the member has old records, read them with `--record-source repo:web` and verify unchanged bytes.

Exercise `workspace add/remove` previews and applies on disposable member directories, keeping the returned registry backups. Test AST/Forge selection refusal at the workspace root without `--repo`, then select one member for read-only AST or Forge status. Use only the documented AST languages and do not perform remote writes for this exercise.

For exclusions, use disposable Git repositories and a separate test Git environment for any global-ignore exercise. Preview local/shared/none transitions, preserve unrelated ignore rules and tracked files, and recover using `migrate bootstrap-rollback --backup "<returned-journal>"` before and with `--apply`. Do not change a real user's global exclusions to run a demo. Also exercise no-Git record creation and its skipped-local-exclusion warning.

Use an interactive terminal to check the guide, final review, cancellation, and `--yes`; use non-interactive input to check explicit defaults and that `--json` never asks. An injected question callback or CLI help alone is not a live-terminal usability test. Record any path that could not be exercised instead of claiming the entire candidate passed.

## 5. Report what was actually verified

Record the package version/checksum, operating system and Node version, selected commands and exit codes, preservation checks, observed MCP calls, and limitations. Separate fixture/copy results from original-project results and host loading from file installation.

If a clean reinstall of real user skills is later intended, preview legacy migration first. A selected uninstall/reinstall must retain its backups and preserve modified/unmanaged files, other products, disabled caches, and user settings. Demonstration success is evidence for a release decision, not an npm publication.
