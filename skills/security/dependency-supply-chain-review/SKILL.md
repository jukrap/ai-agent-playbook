---
name: dependency-supply-chain-review
description: Use when changing dependencies, lockfiles, SBOMs, licenses, containers, package scripts, provenance, or vulnerability remediation.
---

# Dependency Supply Chain Review

Use this as the primary security skill for dependency, SBOM, license, and provenance changes.

## Workflow

1. Identify package manager, lockfile, runtime artifact, container image, generated code, and release gate.
2. Compare direct vs transitive dependency impact, license obligations, vulnerability exploitability, and runtime exposure.
3. Prefer SBOM/provenance evidence and repository-defined audit commands over generic package advice.
4. Verify lockfile consistency, tests/build, license policy, vulnerability scan output, and rollback/update notes.

## Reference

Read `references/dependency-supply-chain-checklist.md` before adding/updating packages, changing lockfiles, reviewing CVEs, or preparing release compliance evidence.

Read `references/sbom-attestation-release-gate.md` when a release needs SBOM generation, license election, VEX/exception handling, image/source attestation, or artifact provenance verification.
