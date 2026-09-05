# Release preparation

Keep the package name and aapb executable. Use 1.0.0-next.1 during prerelease validation and map Python metadata to 1.0.0.dev1. Do not claim the version is published merely because it exists in source.

Before a stable version, complete syntax/type/behavior/translation/public-document checks, an isolated archive install, migration and rollback, actual host loading, and the bounded quality pilot. Record unsupported platforms, skipped checks and unresolved findings. Review the packed file list for local-only data and retired executable modules.

A registry publish, remote push or release creation requires its own authorization. No postinstall hook should activate skills or MCP. Preserve the source baseline and exact prior installation for recovery.
