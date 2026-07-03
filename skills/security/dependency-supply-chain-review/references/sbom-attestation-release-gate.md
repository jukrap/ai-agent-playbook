# SBOM Attestation Release Gate

Use this reference when a release, container, package, plugin, or distributable artifact needs stronger dependency, license, provenance, or vulnerability evidence.

## Release Evidence

- Identify the authoritative artifact: source package, npm/PyPI/Maven/NuGet/Cargo package, Docker image, serverless bundle, mobile artifact, plugin zip, or binary.
- Generate the SBOM from the artifact that actually ships, not only from source files.
- Keep source-level and image-level SBOMs separate when the container includes OS packages or build-time layers.
- Record the package manager, lockfile, build command, generated bundle path, artifact digest, and release workflow identity.

## License Handling

- Check first-party licenses, third-party package licenses, generated notices, and bundled binary licenses.
- For dual-licensed dependencies, record the elected license and the evidence that the elected option is valid.
- Treat unknown, custom, copyleft, source-available, and commercial license references as policy decisions rather than automatic pass/fail.
- Publish or package a human-readable third-party notice when the project or distribution channel expects it.

## Attestation And Provenance

- Bind the SBOM or provenance statement to the artifact digest, repository, workflow identity, and commit.
- Verify attestations before relying on downloaded SBOMs.
- Avoid floating action, image, or installer references in release-critical paths unless the repository has a pinning policy.
- Record whether provenance covers the source package, container image, both, or neither.

## Vulnerability And VEX

- Separate vulnerable-but-unreachable findings from reachable runtime exposure.
- Exception records need owner, scope, expiry or revisit condition, mitigation, and verification evidence.
- VEX or suppression files should be reviewed as release artifacts, not as hidden scanner configuration.
- Re-scan after dependency lockfile changes, base image changes, build tool changes, and generated bundle changes.

## Verification

- Frozen install or reproducible dependency restore.
- SBOM generation for the shipped artifact.
- License policy check against the SBOM.
- Vulnerability scan against the SBOM or final artifact.
- Attestation verification against expected issuer, repository, workflow, commit, and digest when available.
- Release note or handoff entry for exceptions, residual risk, rollback or downgrade path, and next review date.

## Stop Conditions

- The SBOM was generated from a different artifact than the one being released.
- License election or exception evidence is missing.
- A suppression has no owner, scope, expiry, or mitigation.
- Provenance cannot be tied to the artifact digest.
- The release has no rollback, yank, downgrade, or containment plan for dependency-caused incidents.
