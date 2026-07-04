# AI Agent Playbook v2 Mobile Native Hardening Plan

> **For implementers:** Continue after package and connector governance. This plan covers the next weak catalog surface: mobile release readiness, device permission QA, and offline sync behavior across native, React Native, Expo, and hybrid app work.

**Goal:** Add capability-first mobile guidance that works for native apps, Expo/React Native apps, and hybrid WebView containers without making platform-specific skills the primary taxonomy.

**Reference inputs:** The refreshed local reference inventory shows recurring mobile patterns around real-device QA, signing and provisioning, app-store distribution, simulator/emulator limits, platform permissions, WebView risk, and offline/device-state workflows. Adopt those patterns as local skills, workflow contracts, prompts, and validators. Do not copy upstream prose, project names, personal paths, internal URLs, credentials, branch names, PR numbers, or large excerpts into public docs.

## Baseline

- Skill catalog contains 54 skills after the package and connector governance pack.
- The `mobile` category currently has `mobile/webview-bridge` as the only primary skill.
- The `mobile-release` recipe exists, but it only names release inputs and broad verification.
- MCP prompts do not yet include a mobile release or device QA review prompt.
- Existing frontend, backend, security, delivery, and devops skills cover adjacent concerns but do not create a mobile-specific evidence contract.

## Reference-Derived Rules To Adopt

- **Prefer capability-first mobile skills:** Use release, device QA, permission, offline, sync, and bridge boundaries as the primary concepts. Keep Swift, Kotlin, Expo, React Native, and store-specific details in references or project docs.
- **Treat real devices and emulators differently:** Simulators and emulators are useful, but release confidence must record which device capabilities were actually exercised.
- **Make permissions explicit:** Runtime permission prompts, manifest declarations, privacy metadata, degraded states, and denial paths are part of the feature contract.
- **Separate build success from release readiness:** A clean build does not prove signing, versioning, channel, store metadata, privacy declarations, or rollback readiness.
- **Offline and sync are data integrity work:** Cache shape, queue durability, retry/backoff, conflict resolution, idempotency, and network transition behavior need review evidence.
- **Keep debug bridges out of release builds:** Any test bridge, debug server, or agent-control surface must have a release-build exclusion or cleanup check.

## Workstream A: Mobile Release Readiness

### Task A1: Native Release Readiness Skill

**Skill:** `mobile/native-release-readiness`

**References:**

- `release-signing-and-store-checks.md`
- `mobile-build-channel-checks.md`

**Coverage:**

- Platform target, release channel, bundle/application id, version/build number, signing, provisioning, keystore/certificate state, store metadata, privacy declaration, artifact naming, and rollback notes.
- Expo/React Native build profiles, native app build schemes/flavors, internal distribution, TestFlight, Play internal testing, staged rollout, and hotfix constraints.
- Release-build cleanup for debug tools, test endpoints, logging, bridge code, local overrides, and non-production entitlements.

### Task A2: Mobile Release Recipe Upgrade

**Recipe:** `mobile-release`

**Purpose:** Upgrade the existing recipe from a broad checklist into a concrete release evidence contract.

**Acceptance:**

- Inputs, outputs, skills, tools, stop conditions, and verification name release artifacts and platform evidence explicitly.
- The recipe points to `native-release-readiness`, `device-permission-qa`, `offline-sync-review`, `webview-bridge`, `deployment-release-check`, and `test-verification-strategy`.
- CLI workflow preview still passes for the upgraded recipe.

## Workstream B: Device And Permission QA

### Task B1: Device Permission QA Skill

**Skill:** `mobile/device-permission-qa`

**References:**

- `permission-device-matrix.md`
- `lifecycle-and-device-state-checks.md`

**Coverage:**

- Runtime permission prompts, manifest/plist declarations, camera, media, files, location, notifications, biometrics, contacts, microphone, background modes, and platform-specific degraded states.
- Device matrix by OS version, screen size, orientation, network state, background/foreground lifecycle, cold start, app update, reinstall, and permission revocation.
- Evidence naming for real device, simulator/emulator, manual run, automated test, and logs.

### Task B2: Permission Evidence Boundary

**Purpose:** Keep mobile permission review factual and auditable.

**Acceptance:**

- Do not claim a permission path works unless a device/emulator/log/manual check is recorded.
- Do not infer store approval, privacy compliance, or legal acceptance.
- Record unresolved permissions, feature degradation, and product decisions as follow-up items.

## Workstream C: Offline Sync Review

### Task C1: Offline Sync Review Skill

**Skill:** `mobile/offline-sync-review`

**References:**

- `offline-storage-and-queue-checks.md`
- `sync-conflict-retry-checks.md`

**Coverage:**

- Local storage/cache ownership, secure storage, persistence boundaries, queue durability, retry/backoff, idempotency, conflict resolution, partial failure handling, and server reconciliation.
- Network transitions, airplane mode, captive portal, app restart, background fetch, low storage, clock drift, and duplicate submission cases.
- Data loss, stale UI, privacy, and audit evidence.

### Task C2: Cross-Category Routing

**Purpose:** Offline mobile work often crosses database, backend, and security boundaries.

**Acceptance:**

- Skill references route to `database/data-migration-integrity` or `data/data-migration-integrity` only when actual data migration/backfill is involved.
- Route to `backend/api-contract-boundary` for sync API payload or idempotency-key changes.
- Route to `security/auth-access-control` for token refresh, secure storage, biometric unlock, or tenant/object access risk.

## Workstream D: MCP Prompt And Catalog Docs

### Task D1: Mobile Release Review Prompt

**Prompt:** `mobile_release_review`

**Purpose:** Route mobile releases and device QA through release, permission, offline, bridge, deployment, and verification skills.

**Acceptance:**

- Required evidence includes target platforms, build artifacts, signing state, device matrix, permission paths, offline/sync risks, and rollback or hotfix notes.
- Stop conditions include missing signing evidence, release-build debug bridge risk, unavailable target device coverage, unreviewed permission expansion, or untested offline data path.
- Prompt remains read-only and never suggests store submission, credential access, or project writes by default.

### Task D2: Catalog And Public Docs

**Acceptance:**

- README skill list and category summaries include the new mobile skills.
- `docs/classification.md` and `docs/skill-taxonomy-v2.md` document the mobile hardening map.
- Korean translations are updated in the same change.
- Skill count expectations are updated from 54 to 57.

## Workstream E: Verification

Run after each implementation slice:

- `npm run check`
- `node --test --test-reporter=dot test/*.test.mjs`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --check`

## Suggested Order

1. Add and commit this plan.
2. Add `native-release-readiness`, `device-permission-qa`, and `offline-sync-review` skills with references and translations.
3. Update catalog docs and skill-count tests, then commit the mobile skill pack.
4. Upgrade the `mobile-release` recipe and Korean translation.
5. Add `mobile_release_review` MCP prompt with prompt contract tests and command docs.
6. Re-run full verification and choose the next weak category from refreshed catalog counts.

## Non-Goals

- No default store submission, certificate generation, keystore access, network upload, telemetry, or live device control.
- No legal or store-approval claims.
- No platform-specific primary skill for Swift, Kotlin, Expo, or React Native.
- No project source writes through MCP.
