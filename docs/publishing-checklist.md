# Publishing checklist

Node and Python release metadata must agree; npm `next.N` prereleases map to Python `devN`. A version in source is not proof of registry publication. Test the exact archive before publishing and install the registry copy afterward.

## Prepare the release candidate

1. Inspect the branch, dirty state, intended diff, and preserved user changes.
2. Align `package.json`, `src/version.mjs`, Python metadata/version, changelog, and version-specific guidance. Stable `1.1.0` must be an intentional promotion, not an accidental tag change.
3. Run the required [maintenance checks](maintenance.md), including behavior, translation, public-document, and wrapper previews.
4. Follow the beginner walkthrough and changed command examples in isolated folders. Review both README presentations and Korean clarity.
5. Inspect the archive file list for runtime files, selected skills, references, linked guides, examples, and images. Exclude private records, backups, raw logs, test installs, and retired executable modules.

## Pack and install before publishing

```powershell
npm pack --dry-run --json
npm pack
npm install --prefix "<demo-prefix>" --ignore-scripts "<archive.tgz>"
node "<demo-prefix>/node_modules/ai-agent-playbook/bin/aapb.mjs" --version
node "<demo-prefix>/node_modules/ai-agent-playbook/bin/aapb.mjs" --help
```

Use a fresh prefix and record the archive checksum. Test the CLI from that installed archive, not accidentally from a source checkout or global command. Verify record reads, scoped skills, applicable migration/rollback, and an actual MCP stdio session. Existing project demonstrations should preserve original records; apply/rollback can use copies. See [Demo](demo.md).

Check relative Markdown links and HTML image/link attributes inside the archive. Inspect expected file paths in prose as well. A README image present in Git can still be missing from npm if the file allowlist excludes it.

## Publication and verification

Only after the exact candidate and publication are authorized, publish the tested archive. A prerelease uses the `next` tag; stable `latest` is a separate promotion decision.

```powershell
npm publish "<verified-archive.tgz>" --tag latest --dry-run
```

The command above previews publication. It does not prove registry authentication, permissions, successful upload, or public availability. An actual publish removes `--dry-run`; do not perform it merely because packaging succeeded.

After intentional publication, inspect the exact registry version and tag, install that version into a fresh prefix, and repeat the entrypoint smoke checks. Record publication, Git push/PR/merge, and local installation separately. Package installation must not activate skills, MCP, or hooks automatically.

## GitHub release from the same artifact

After the release changes are merged, identify the verified source commit. Use the same archive and checksum file for GitHub and npm. Adapt these placeholders to the verified artifacts:

```sh
gh release create v1.1.0 "<verified-archive.tgz>" "<checksum-file>" --target "<verified-commit>" --title "AI Agent Playbook 1.1.0" --notes-file "<release-notes.md>" --latest
```

The explicit target binds an absent tag to that commit. If the tag already exists, inspect its target before proceeding; do not move an existing release tag. Check both publication results separately. See [GitHub CLI release creation](https://cli.github.com/manual/gh_release_create) and [npm publication](https://docs.npmjs.com/cli/v10/commands/npm-publish/).

## Recovery and release notes

Keep the previous global package separately from a source tag when their versions differ. Preserve skill transaction directories and record-layout archives. Recovery order and hash-conflict handling are in [Lifecycle](lifecycle.md).

Release notes should explain changed commands and tool names, retired behavior and pinned recovery, affected installation/record paths, completed checks, and remaining limits. Do not publish private evidence or imply that mocked remote tests prove live writes. Keep English and Korean release-facing guidance aligned.
