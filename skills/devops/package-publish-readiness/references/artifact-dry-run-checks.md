# Artifact Dry-Run Checks

Use this when verifying what will actually ship.

## Dry-Run Evidence

- Use repository-defined package, build, or publish dry-run commands first.
- Capture artifact file list, size, checksums or digests when available, and relevant warnings.
- Confirm the dry-run is for the intended registry, channel, target platform, and package manager.
- Compare the artifact against the expected runtime surface rather than the entire source tree.

## Artifact Review

- Verify generated output, type declarations, schemas, templates, binaries, migrations, static assets, and manifest files.
- Check install behavior for CLI shims, plugin discovery, optional dependencies, peer dependencies, and native/platform packages.
- Confirm provenance, attestation, signing, or digest binding when the project supports it.
- Record whether unpublish, rollback, yanking, dist-tag move, or marketplace rollback is possible and who can do it.

## Avoid

- Publishing or logging into registries unless the user explicitly asks for it.
- Treating a passing build as proof that package contents are correct.
- Ignoring warnings from pack/publish dry-runs because tests passed.
- Copying registry tokens, auth headers, or full machine-local paths into durable notes.
