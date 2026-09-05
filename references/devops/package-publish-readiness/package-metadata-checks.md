# Package Metadata Checks

Use this when a package, CLI, plugin, library, extension, or marketplace bundle is being prepared for release.

## Metadata

- Package name, scope, version, description, keywords, author/maintainer, repository, homepage, bugs, funding, and license fields.
- Runtime entrypoints: main/module/exports, bin, types, browser, side effects, plugin manifests, native assets, and platform packages.
- Publication scope: public/private, registry, dist-tag or release channel, package access, signing, provenance, and two-factor or approval gates.
- Changelog, release notes, migration notes, deprecation notes, and compatibility range.

## File Boundaries

- Confirm include/exclude rules such as `files`, ignore files, package manifests, build output, generated assets, and source maps.
- Make sure README, license, notice, type declarations, schemas, templates, and runtime assets needed by consumers are included.
- Keep test fixtures, local configs, credentials, private logs, raw reference material, and machine-specific paths out of the artifact.
- Check that platform-specific binaries or optional packages match supported OS/architecture naming and installation behavior.

## Stop Conditions

- Version source is unclear or conflicts with tags, changelog, lockfile, or package metadata.
- Public package metadata still contains placeholders, internal URLs, private names, or incorrect repository links.
- Runtime entrypoints point to files that are missing from the packed artifact.
- The release depends on generated files that are stale or not reproducible by documented commands.
