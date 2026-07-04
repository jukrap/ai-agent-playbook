# AI Agent Playbook v2 모바일 네이티브 하드닝 계획

> **구현자용:** 패키지/커넥터 거버넌스 이후 이어서 진행합니다. 이 계획은 현재 카탈로그에서 약한 축인 모바일 릴리스 준비, 기기 권한 QA, 네이티브/React Native/Expo/하이브리드 앱의 오프라인 동기화 동작을 다룹니다.

**목표:** 네이티브 앱, Expo/React Native 앱, 하이브리드 WebView 컨테이너에 모두 적용 가능한 capability-first 모바일 지침을 추가하되, 플랫폼별 스킬을 1차 분류로 만들지 않습니다.

**레퍼런스 입력:** 갱신된 로컬 레퍼런스 인벤토리에서 실제 기기 QA, 서명/프로비저닝, 앱스토어 배포, 시뮬레이터/에뮬레이터 한계, 플랫폼 권한, WebView 위험, 오프라인/기기 상태 워크플로우 패턴이 반복됩니다. 이 패턴을 로컬 스킬, 워크플로우 계약, 프롬프트, 검증기로 흡수합니다. 상류 원문, 프로젝트명, 개인 경로, 내부 URL, 자격 증명, 브랜치명, PR 번호, 긴 발췌문은 공개 문서에 복사하지 않습니다.

## 기준 상태

- 패키지/커넥터 거버넌스 pack 이후 스킬 카탈로그는 54개 스킬을 포함합니다.
- `mobile` 카테고리의 primary skill은 현재 `mobile/webview-bridge` 하나뿐입니다.
- `mobile-release` recipe는 있지만 릴리스 입력과 넓은 검증만 명시합니다.
- MCP 프롬프트에는 아직 모바일 릴리스나 기기 QA 검토 프롬프트가 없습니다.
- 기존 frontend, backend, security, delivery, devops 스킬은 인접 관심사를 다루지만 모바일 전용 증거 계약을 만들지는 않습니다.

## 레퍼런스에서 채택할 규칙

- **capability-first 모바일 스킬을 우선합니다:** release, device QA, permission, offline, sync, bridge 경계를 1차 개념으로 사용합니다. Swift, Kotlin, Expo, React Native, 스토어별 세부사항은 reference나 프로젝트 문서에 둡니다.
- **실제 기기와 에뮬레이터를 구분합니다:** 시뮬레이터와 에뮬레이터는 유용하지만, 릴리스 신뢰도에는 실제로 어떤 기기 기능을 확인했는지 기록해야 합니다.
- **권한을 명시적으로 다룹니다:** 런타임 권한 prompt, manifest 선언, privacy metadata, degraded state, denial path는 기능 계약의 일부입니다.
- **빌드 성공과 릴리스 준비를 분리합니다:** clean build는 signing, versioning, channel, store metadata, privacy declaration, rollback readiness를 증명하지 않습니다.
- **오프라인과 sync는 데이터 무결성 작업입니다:** cache shape, queue durability, retry/backoff, conflict resolution, idempotency, network transition 동작에는 검토 증거가 필요합니다.
- **debug bridge는 release build에 남기지 않습니다:** test bridge, debug server, agent-control surface에는 release-build 제외 또는 cleanup check가 있어야 합니다.

## Workstream A: 모바일 릴리스 준비

### Task A1: Native Release Readiness Skill

**Skill:** `mobile/native-release-readiness`

**References:**

- `release-signing-and-store-checks.md`
- `mobile-build-channel-checks.md`

**Coverage:**

- platform target, release channel, bundle/application id, version/build number, signing, provisioning, keystore/certificate state, store metadata, privacy declaration, artifact naming, rollback notes.
- Expo/React Native build profiles, native app build schemes/flavors, internal distribution, TestFlight, Play internal testing, staged rollout, hotfix constraints.
- debug tools, test endpoints, logging, bridge code, local overrides, non-production entitlements의 release-build cleanup.

### Task A2: Mobile Release Recipe Upgrade

**Recipe:** `mobile-release`

**Purpose:** 기존 recipe를 넓은 체크리스트에서 구체적인 릴리스 증거 계약으로 강화합니다.

**Acceptance:**

- inputs, outputs, skills, tools, stop conditions, verification이 release artifact와 platform evidence를 명시합니다.
- recipe는 `native-release-readiness`, `device-permission-qa`, `offline-sync-review`, `webview-bridge`, `deployment-release-check`, `test-verification-strategy`를 가리킵니다.
- 업그레이드 후에도 CLI workflow preview가 통과합니다.

## Workstream B: 기기와 권한 QA

### Task B1: Device Permission QA Skill

**Skill:** `mobile/device-permission-qa`

**References:**

- `permission-device-matrix.md`
- `lifecycle-and-device-state-checks.md`

**Coverage:**

- runtime permission prompt, manifest/plist declaration, camera, media, files, location, notifications, biometrics, contacts, microphone, background modes, platform-specific degraded state.
- OS version, screen size, orientation, network state, background/foreground lifecycle, cold start, app update, reinstall, permission revocation 기준의 device matrix.
- real device, simulator/emulator, manual run, automated test, log evidence의 구분.

### Task B2: Permission Evidence Boundary

**Purpose:** 모바일 권한 검토를 사실 기반으로 남깁니다.

**Acceptance:**

- device/emulator/log/manual check가 기록되지 않은 permission path는 작동한다고 주장하지 않습니다.
- store approval, privacy compliance, legal acceptance를 추론하지 않습니다.
- unresolved permission, feature degradation, product decision은 follow-up으로 기록합니다.

## Workstream C: 오프라인 Sync Review

### Task C1: Offline Sync Review Skill

**Skill:** `mobile/offline-sync-review`

**References:**

- `offline-storage-and-queue-checks.md`
- `sync-conflict-retry-checks.md`

**Coverage:**

- local storage/cache ownership, secure storage, persistence boundary, queue durability, retry/backoff, idempotency, conflict resolution, partial failure handling, server reconciliation.
- network transition, airplane mode, captive portal, app restart, background fetch, low storage, clock drift, duplicate submission case.
- data loss, stale UI, privacy, audit evidence.

### Task C2: Cross-Category Routing

**Purpose:** 오프라인 모바일 작업은 database, backend, security 경계를 함께 건드립니다.

**Acceptance:**

- 실제 data migration/backfill이 있을 때만 `database/data-migration-integrity` 또는 `data/data-migration-integrity`로 라우팅합니다.
- sync API payload나 idempotency-key 변경은 `backend/api-contract-boundary`로 라우팅합니다.
- token refresh, secure storage, biometric unlock, tenant/object access risk는 `security/auth-access-control`로 라우팅합니다.

## Workstream D: MCP Prompt와 Catalog Docs

### Task D1: Mobile Release Review Prompt

**Prompt:** `mobile_release_review`

**Purpose:** 모바일 릴리스와 기기 QA를 release, permission, offline, bridge, deployment, verification 스킬로 라우팅합니다.

**Acceptance:**

- required evidence는 target platforms, build artifacts, signing state, device matrix, permission paths, offline/sync risks, rollback/hotfix notes를 포함합니다.
- stop conditions는 missing signing evidence, release-build debug bridge risk, unavailable target device coverage, unreviewed permission expansion, untested offline data path를 포함합니다.
- prompt는 read-only로 유지하며 store submission, credential access, project write를 기본 제안하지 않습니다.

### Task D2: Catalog And Public Docs

**Acceptance:**

- README skill list와 category summary에 새 모바일 스킬을 반영합니다.
- `docs/classification.md`와 `docs/skill-taxonomy-v2.md`에 mobile hardening map을 문서화합니다.
- 한국어 번역을 같은 변경에서 갱신합니다.
- skill count 기대값을 54에서 57로 갱신합니다.

## Workstream E: 검증

각 구현 단위 뒤에 실행합니다.

- `npm run check`
- `node --test --test-reporter=dot test/*.test.mjs`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --check`

## 제안 순서

1. 이 계획을 추가하고 커밋합니다.
2. `native-release-readiness`, `device-permission-qa`, `offline-sync-review` 스킬과 reference, 번역을 추가합니다.
3. catalog docs와 skill-count test를 갱신한 뒤 모바일 skill pack을 커밋합니다.
4. `mobile-release` recipe와 한국어 번역을 강화합니다.
5. `mobile_release_review` MCP prompt를 prompt contract test와 command docs와 함께 추가합니다.
6. 전체 검증을 다시 실행하고 갱신된 catalog count에서 다음 약한 카테고리를 선택합니다.

## 비목표

- 기본 store submission, certificate generation, keystore access, network upload, telemetry, live device control은 추가하지 않습니다.
- 법률 판단이나 스토어 승인 보장을 하지 않습니다.
- Swift, Kotlin, Expo, React Native를 platform-specific primary skill로 만들지 않습니다.
- MCP를 통한 project source write는 추가하지 않습니다.
