# Dependency Supply Chain Checklist

## Inventory

- Package manager and lockfile: npm/pnpm/yarn, pip/uv/poetry, Maven/Gradle, NuGet, Go modules, Composer, Cargo, system packages, or container layers.
- Artifact: source package, application bundle, Docker image, serverless bundle, mobile app, CLI, or plugin.
- Dependency type: runtime, dev/test, build, optional, peer, transitive, OS-level, or generated tool.
- Policy files: license allow/deny lists, audit ignore files, VEX, vulnerability exceptions, package overrides, and provenance settings.

## Review

- Confirm why the dependency is needed and whether an existing dependency or standard library covers the need.
- Check package health: maintainer activity, release cadence, install scripts, native binaries, transitive footprint, and known advisories.
- Check license compatibility against the repository policy; do not assume permissive from package popularity.
- Separate vulnerable-but-unreachable from reachable runtime exposure, and record the evidence.
- Treat lockfile, package scripts, registry config, Docker base image, and CI action versions as supply-chain surface.
- Prefer pinned versions or repository convention; avoid floating action/container tags in release-critical paths.

## SBOM And License Evidence

- Use the repository's SBOM/audit tooling when present.
- If no SBOM exists, record the package manager audit command and lockfile diff as minimum evidence.
- License review should include first-party, third-party, dual-license election, and generated artifact exposure.
- Vulnerability exceptions need scope, expiry/revisit condition, owner, and proof of non-exploitability or mitigation.
- Attestation/provenance checks should bind artifacts to the expected repository, workflow, commit, and digest when available.

## Verification

- Lockfile install check or frozen install.
- Unit/integration tests covering the code path that uses the dependency.
- Build/package command for the artifact that will ship.
- License/SBOM check and vulnerability scan when available.
- Manual note for residual risk, exception expiry, and rollback path.

## Common Mistakes

- Updating a direct dependency while ignoring newly introduced transitive packages.
- Treating dev dependencies as harmless when they run install/build scripts or ship in containers.
- Accepting audit output without checking whether the vulnerable code path is reachable.
- Recording a permanent ignore without an owner, expiry, or compensating control.
- Changing package managers or lockfile format as a side effect of a small dependency update.
