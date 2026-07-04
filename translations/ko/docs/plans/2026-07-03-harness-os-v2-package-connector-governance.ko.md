# AI Agent Playbook v2 Package And Connector Governance Plan

> **For implementer:** testing/QA delivery pack 확장 이후 이어서 진행합니다. 이 계획은 다음 high-signal reference pattern인 package/release artifact governance, license/notice evidence, connector/integration safety를 다룹니다.

**Goal:** 기존 supply-chain skill과 중복하지 않고, vendor-specific primary skill을 만들지 않으면서 package publishing, compliance evidence, connector change를 위한 capability-first guidance를 추가합니다.

**Reference input:** 갱신된 local reference inventory는 compliance, package metadata, release dry-run, connector manifest, MCP surface, credential handling, test evidence 전반에서 반복 signal을 보입니다. 이 pattern을 local skill, workflow contract, prompt, validator로 채택합니다. Public doc에는 upstream prose, project name, personal path, internal URL, credential, branch name, PR number, 큰 excerpt를 복사하지 않습니다.

## Baseline

- Testing/QA delivery pack 이후 skill catalog는 51개 skill을 포함합니다.
- `security/dependency-supply-chain-review`는 이미 dependency, lockfile, SBOM, license, provenance, container, CVE review를 다룹니다.
- `devops/deployment-release-check`는 deployment gate와 rollback readiness를 다룹니다.
- MCP prompt는 deployment, frontend quality, data integrity, ADR/spec handoff review를 다룹니다.
- Workflow run scaffold는 `.ai-agent-playbook/workflows/runs/` 아래 bounded run record 생성을 지원합니다.

## Reference-Derived Rules To Adopt

- **Package contents와 dependency risk를 분리합니다:** Dependency audit만으로는 부족합니다. Shipped artifact에는 file inclusion, metadata, version, generated asset, registry dry-run check가 필요합니다.
- **Compliance evidence를 evidence로 다룹니다:** License와 notice note는 broad reassurance 대신 policy, source, artifact, exception owner, review date를 명명해야 합니다.
- **Connector change는 runtime contract입니다:** Credential, permission, registration metadata, retry behavior, pagination, rate limit, webhook, error wrapping은 public integration contract의 일부입니다.
- **Vendor-first primary skill을 만들지 않습니다:** Platform-specific package, connector, marketplace detail은 reference, profile, local project doc에 둡니다.
- **Hidden network나 write는 없습니다:** 기본 review skill과 MCP prompt는 read-only를 유지합니다. Publishing, registry access, token check, artifact write는 명시적인 project command와 user intent가 필요합니다.

## Workstream A: Package Release Governance

### Task A1: Package Publish Readiness Skill

**Skill:** `devops/package-publish-readiness`

**References:**

- `package-metadata-checks.md`
- `artifact-dry-run-checks.md`

**Coverage:**

- npm을 가정하지 않는 package manager와 registry 감지.
- Version, changelog, files/include list, entrypoint, binary asset, platform package, generated output, README, license, notice presence.
- Repository가 정의한 dry-run pack/publish command.
- Project가 지원하는 provenance, signing, tag, dist-channel, rollback note.

### Task A2: Package Release Recipe

**Recipe:** `package-release-readiness`

**Purpose:** Package, CLI, plugin, library, marketplace bundle을 위한 multi-step run입니다.

**Acceptance:**

- Input, output, skill, tool, stop condition, verification이 명시됩니다.
- Recipe는 `package-publish-readiness`, `dependency-supply-chain-review`, `deployment-release-check`, `test-verification-strategy`를 가리킵니다.
- Preview smoke test가 새 recipe를 포함합니다.

## Workstream B: License And Notice Evidence

### Task B1: License Notice Review Skill

**Skill:** `security/license-notice-review`

**References:**

- `license-policy-evidence.md`
- `notice-attribution-checks.md`

**Coverage:**

- First-party license, third-party license, vendored code, generated artifact, copied snippet, dual-license choice, notice/attribution requirement.
- Repository policy와 artifact contents.
- Owner, expiry 또는 revisit condition, redistribution scope가 있는 exception.

### Task B2: Evidence Boundary

**Purpose:** License/notice review를 portable하고 noise-free하게 유지합니다.

**Acceptance:**

- Skill doc에 full license나 큰 third-party excerpt를 붙여넣지 않습니다.
- Legal approval을 추론하지 않고 evidence, risk, unresolved policy question을 기록합니다.
- Public doc에는 personal path, internal URL, customer name, raw reference label을 넣지 않습니다.

## Workstream C: Connector And Integration Safety

### Task C1: Connector Integration Change Skill

**Skill:** `backend/connector-integration-change`

**References:**

- `connector-contract-checks.md`
- `credential-webhook-error-handling.md`

**Coverage:**

- API connector, workflow node, MCP adapter, webhook, OAuth app, import/export bridge, sync job, third-party integration change.
- Credential reference, scope, secret handling, auth helper usage, pagination, rate limit, idempotency, retry, timeout, partial failure handling.
- Registration metadata, generated schema, discoverability, host runtime convention과의 compatibility.

### Task C2: Connector Review Prompt

**Prompt:** `connector_integration_review`

**Purpose:** Integration change를 connector, API contract, auth/access, supply-chain, verification skill로 라우팅합니다.

**Acceptance:**

- Required evidence에는 affected connector file, credential/auth boundary, contract example, failure/retry behavior, verification command가 포함됩니다.
- Stop condition에는 missing credential contract, review 없는 permission scope 확장, untested webhook lifecycle, artifact registration drift가 포함됩니다.
- Prompt는 read-only를 유지하고 기본적으로 write apply를 제안하지 않습니다.

## Workstream D: Catalog, Docs, And Translation

### Task D1: Catalog And Public Docs

**Acceptance:**

- README skill list와 category summary가 새 skill을 포함합니다.
- `docs/classification.md`와 `docs/skill-taxonomy-v2.md`가 package/compliance/connector map을 문서화합니다.
- Korean translation은 같은 변경에서 갱신합니다.
- Skill count expectation을 갱신합니다.

### Task D2: MCP And Workflow Docs

**Acceptance:**

- 구현 시 `docs/commands.md`와 Korean translation이 새 prompt를 나열합니다.
- Workflow recipe와 MCP prompt는 기존 drift/smoke test로 보호됩니다.

## Workstream E: Verification

각 implementation slice 이후 실행합니다.

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

1. 이 계획을 추가하고 커밋합니다.
2. Package publish readiness, license notice review, connector integration change skill과 reference, translation을 추가합니다.
3. Catalog/docs/tests를 갱신하고 skill pack을 커밋합니다.
4. `package-release-readiness` recipe와 translation, smoke coverage를 추가합니다.
5. `connector_integration_review` MCP prompt와 prompt contract test, docs를 추가합니다.
6. Full verification을 다시 실행하고 갱신된 reference signal에서 다음 pack을 선택합니다.

## Non-Goals

- 기본 registry login, publishing, network vulnerability lookup, telemetry, marketplace sync는 하지 않습니다.
- Legal advice나 legal approval claim을 하지 않습니다.
- Vendor-specific primary skill을 만들지 않습니다.
- MCP를 통한 project source write는 하지 않습니다.
