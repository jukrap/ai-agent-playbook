# Demonstrate an unpublished AAPB package

Registry publication is not a prerequisite. Packing and installing the archive exercises the release file list, CLI entrypoint and dependencies without publishing an intermediate version. Keep the tested archive and its checksum for a later intentional publication.

## Install an isolated archive

Run npm pack in a verified source checkout. Replace the archive and prefix placeholders below. The prefix is a separate local demonstration directory, not an existing global installation.

```sh
npm pack
npm install --prefix <demo-prefix> --ignore-scripts <archive.tgz>
node <demo-prefix>/node_modules/ai-agent-playbook/bin/aapb.mjs --version
```

Package installation does not install skills or enable MCP. Use that archive's CLI for the following examples, or the verified aapb executable after an intentional global installation.

## Existing records

```sh
aapb records status <project> --json
aapb records status <project> --view records --page-size 7 --json
aapb records read <project> --path CURRENT.md --max-chars 700 --json
aapb records search <project> --query <literal> --max-results 2 --json
aapb records validate <project> --page-size 4 --json
aapb migrate layout <project> --to minimal --json
```

Continue a read with the same path and --cursor from nextCursor. For lists, use page.nextCursor and repeat the view or query. Concatenate read content without adding separators and compare with the source text. A UTF-8 BOM is omitted from text output; the SHA-256 still identifies the original bytes. Positions and character budgets use JavaScript UTF-16 units, preserving surrogate pairs.

Check page totals, source locations, warnings and scan.complete on every page. managed-modified reports preserved customization; it does not prove a prose or product defect. Do not rewrite a source document just to clear that signal. Missing ownership metadata can correctly prevent layout migration while record reading remains available.

Use a preserved record copy for apply/rollback demonstrations. Verify every original copied file after rollback; a recovery archive is intentionally retained. Keep product checks separate from record validation, which never sets runtimeVerified to true.

## MCP and installation cleanup

Start an ephemeral aapb mcp --project <project> process with an SDK stdio client to exercise aapb_status, aapb_search, aapb_read and aapb_validate. This does not require enabling a common host MCP entry. An SDK round trip proves the server/transport behavior, not how every host renders results or accounts for tokens.

Before replacing installed skills, preview skills migrate --profile development --dry-run --json and inspect ownership/conflicts. Ordinary updates affect only selected managed skills. If a clean reinstall is intended, preview and then uninstall the selected profile, keep its returned backup, and install the verified profile from the archive. Preserve modified/unmanaged skills, other products, disabled plugin caches and recovery archives.
