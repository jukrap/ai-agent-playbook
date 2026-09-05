# Dependency Supply Chain Checklist

## Inventory

- Package manager and lockfile: npm/pnpm/yarn, pip/uv/poetry, Maven/Gradle, NuGet, Go modules, Composer, Cargo, system packages, container layers.
- Artifact: source package, application bundle, Docker image, serverless bundle, mobile app, CLI, plugin.
- Dependency type: runtime, dev/test, build, optional, peer, transitive, OS-level, generated tool.
- Policy files: license allow/deny list, audit ignore file, VEX, vulnerability exception, package override, provenance setting.

## Review

- Dependency가 왜 필요한지, 기존 dependency 또는 standard library로 충분한지 확인합니다.
- Package health: maintainer activity, release cadence, install script, native binary, transitive footprint, known advisory를 확인합니다.
- License compatibility는 repository policy 기준으로 확인합니다. Package popularity만 보고 permissive라고 가정하지 않습니다.
- Vulnerable-but-unreachable와 reachable runtime exposure를 분리하고 evidence를 기록합니다.
- Lockfile, package script, registry config, Docker base image, CI action version은 supply-chain surface입니다.
- Repository convention을 따르되 release-critical path에서는 floating action/container tag를 피합니다.

## SBOM And License Evidence

- Repository에 SBOM/audit tooling이 있으면 그것을 사용합니다.
- SBOM이 없으면 package manager audit command와 lockfile diff를 최소 evidence로 기록합니다.
- License review는 first-party, third-party, dual-license election, generated artifact exposure를 포함합니다.
- Vulnerability exception에는 scope, expiry/revisit condition, owner, non-exploitability 또는 mitigation proof가 필요합니다.
- Attestation/provenance check는 가능하면 artifact를 expected repository, workflow, commit, digest에 연결합니다.

## Verification

- Lockfile install check 또는 frozen install.
- Dependency를 쓰는 code path의 unit/integration test.
- 실제 shipping artifact에 대한 build/package command.
- 가능한 경우 license/SBOM check와 vulnerability scan.
- Residual risk, exception expiry, rollback path에 대한 manual note.

## Common Mistakes

- Direct dependency만 update하고 새 transitive package를 무시합니다.
- Dev dependency가 install/build script를 실행하거나 container에 포함되는데 harmless하다고 봅니다.
- Vulnerable code path reachability를 확인하지 않고 audit output만 수용합니다.
- Owner, expiry, compensating control 없이 permanent ignore를 기록합니다.
- 작은 dependency update 중 package manager 또는 lockfile format을 바꿉니다.
