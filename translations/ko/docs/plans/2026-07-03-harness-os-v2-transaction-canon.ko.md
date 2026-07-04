# AI Agent Playbook V2 Transaction And Canon Implementation Plan

> **구현자 참고:** 이 계획은 task 단위로 실행합니다. 각 task는 별도로 검토 가능하게 유지하고, 검증된 논리 단위마다 commit합니다.

**Goal:** 현재 AI Agent Playbook v2 preview surface를 transaction handoff, reference adoption validation, 명시적 runtime-to-memory promotion을 갖춘 evidence lifecycle로 확장합니다.

**Architecture:** 기본 harness는 read-only와 local-first를 유지합니다. Generated evidence는 `.ai-agent-playbook/runtime/` 아래에 두고, 장기 신뢰 fact는 명시적 promotion command를 통해 source, scan range, confidence, drift check와 함께 `.ai-agent-playbook/memory/`로 이동합니다. MCP는 write tier가 명시적으로 활성화되기 전까지 discovery와 read-only analysis surface로 유지합니다.

**Tech Stack:** Dependency-light Node ESM CLI, Node test runner, stdio MCP tools/resources/prompts, Korean translation이 있는 Markdown docs, PowerShell validation scripts.

---

## Current Baseline

- `reference inventory`는 큰 source content를 복사하지 않고 local reference collection을 요약합니다.
- `reference ledger-check`는 `.ai-agent-playbook/knowledge/reference-adoption-ledger.md`의 adoption status와 local-only leak pattern을 검증합니다.
- `write-gate preview`는 read-only를 유지하면서 transaction id와 planned runtime advisory path를 반환합니다.
- MCP는 read-only reference inventory, ledger validation, reference adoption review prompt surface를 노출합니다.
- Runtime output은 사람이 신뢰하는 memory와 분리되어 있습니다.

## Boundaries

- 기본 network indexing을 추가하지 않습니다.
- MCP를 통해 project source rewrite를 노출하지 않습니다.
- Embedding을 필수로 만들지 않습니다.
- Public docs에 raw upstream excerpt를 복사하지 않습니다.
- 명시 command 없이 generated runtime report를 memory로 promotion하지 않습니다.
- Public docs에 local absolute path, internal URL, credential, company name, branch name, PR number를 넣지 않습니다.

## Task 1: Harden Reference Ledger Validation

**Files:**

- Modify: `src/catalog/reference-adoption.mjs`
- Modify: `src/cli.mjs`
- Modify: `src/mcp-tools.mjs`
- Modify: `docs/commands.md`
- Modify: `translations/ko/docs/commands.ko.md`
- Test: `test/cli.test.mjs`
- Test: `test/mcp.test.mjs`

**Steps:**

1. `reference ledger-check --strict`, custom `--path`, capability-grouped summary에 대한 failing CLI test를 추가합니다.
2. `reference_ledger_check`가 같은 grouped summary를 반환하고 여전히 파일을 쓰지 않는지 MCP test를 추가합니다.
3. Targeted test를 실행합니다.

   ```powershell
   node --test test/cli.test.mjs test/mcp.test.mjs
   ```

   Expected: strict mode와 capability summary가 아직 없으므로 새 test가 실패합니다.

4. `--strict`가 있을 때만 oversized excerpt를 warning이 아니라 conflict로 다루도록 구현합니다.
5. 알 수 없는 column에 관대하게 동작하면서 capability/domain column을 안정적인 summary shape로 파싱합니다.
6. 더 엄격한 동작과 custom ledger path option을 영문/한국어 문서에 기록합니다.
7. Targeted test를 다시 실행합니다.

   Expected: targeted test가 통과하고 read-only test case에서 파일이 쓰이지 않습니다.

8. Commit합니다.

   ```powershell
   git add src/catalog/reference-adoption.mjs src/cli.mjs src/mcp-tools.mjs test/cli.test.mjs test/mcp.test.mjs docs/commands.md translations/ko/docs/commands.ko.md
   git commit
   ```

## Task 2: Add Write-Gate Advisory Save

**Files:**

- Modify: `src/operator/write-gate.mjs`
- Modify: `src/cli.mjs`
- Modify: `src/mcp-tools.mjs`
- Modify: `docs/commands.md`
- Modify: `translations/ko/docs/commands.ko.md`
- Test: `test/cli.test.mjs`
- Test: `test/mcp.test.mjs`

**Steps:**

1. 기본은 preview이고 `--apply`가 있을 때만 쓰는 새 `write-gate advisory <target>` command failing test를 추가합니다.
2. Advisory write는 target path가 `.ai-agent-playbook/runtime/reports/write-gate/` 내부로 resolve되지 않으면 거부하는지 확인합니다.
3. MCP가 기본적으로 apply-capable command를 노출하지 않는지 확인합니다.
4. Targeted test를 실행합니다.

   ```powershell
   node --test test/cli.test.mjs test/mcp.test.mjs
   ```

   Expected: advisory save가 아직 없으므로 test가 실패합니다.

5. 기존 preview engine과 transaction id shape를 재사용해 command를 구현합니다.
6. Dry-run mode에서는 파일을 쓰지 않고 planned advisory JSON만 반환합니다.
7. `--apply` mode에서는 playbook runtime 아래에만 advisory를 쓰고, schema version, target, intent, scan range, warnings, blockers, generated timestamp를 포함한 audit-friendly manifest section을 넣습니다.
8. Docs와 translations를 갱신합니다.
9. Targeted test와 `npm run check`를 다시 실행합니다.

   Expected: targeted test와 syntax check가 통과합니다.

10. Write-gate advisory slice를 commit합니다.

## Task 3: Add Post-Write Check

**Files:**

- Modify: `src/operator/write-gate.mjs`
- Modify: `src/operator/preflight-delta.mjs` if reusable diff logic is needed
- Modify: `src/cli.mjs`
- Modify: `docs/commands.md`
- Modify: `translations/ko/docs/commands.ko.md`
- Test: `test/cli.test.mjs`

**Steps:**

1. `write-gate post-check <target> --advisory <path>` failing test를 추가합니다.
2. 없거나 mismatch인 advisory path는 잘못된 확신 대신 `unknown`을 내는지 확인합니다.
3. Advisory file snapshot이 있을 때 changed, added, deleted, out-of-scope path를 보고하는지 확인합니다.
4. Targeted CLI test를 실행합니다.

   Expected: post-check가 아직 없으므로 test가 실패합니다.

5. 저장된 advisory file을 읽는 read-only post-check를 구현합니다.
6. 전체 프로젝트 coverage를 추론하지 않고 advisory의 scan range와 confidence wording을 보존합니다.
7. Docs와 translations를 갱신합니다.
8. Targeted test, `npm run check`, `npm test`를 다시 실행합니다.
9. Post-check slice를 commit합니다.

## Task 4: Introduce Canon Draft And Check

**Files:**

- Create: `src/memory/canon.mjs`
- Modify: `src/harness.mjs`
- Modify: `src/cli.mjs`
- Modify: `src/mcp-tools.mjs`
- Modify: `docs/playbook-layout-v2.md`
- Modify: `docs/commands.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`
- Test: `test/mcp.test.mjs`
- Test: `test/module-boundaries.test.mjs`

**Steps:**

1. 기존 runtime report와 file inventory를 사용하는 `canon draft <target>` failing test를 추가합니다.
2. promoted fact의 missing, stale, changed, unverified state를 확인하는 `canon check <target>` failing test를 추가합니다.
3. `canon draft`는 read-only로 유지하고 proposed fact만 반환합니다.
4. Minimal fact schema를 구현합니다.

   ```json
   {
     "id": "route.auth.login",
     "kind": "route-api-hint",
     "sourceReport": ".ai-agent-playbook/runtime/reports/example.json",
     "scanRange": ["src/**"],
     "confidence": "medium",
     "observedAt": "YYYY-MM-DD"
   }
   ```

5. 현재 target file과 available runtime report를 기준으로 read-only drift check를 구현합니다.
6. MCP에는 `canon_check`를 read-only로 노출하고, promotion write tool은 이 task에서 제외합니다.
7. Docs와 translations를 갱신합니다.
8. 아래를 실행합니다.

   ```powershell
   npm run check
   npm test
   .\scripts\validate-translations.ps1
   ```

   Expected: 모두 통과합니다.

9. Canon read-only slice를 commit합니다.

## Task 5: Add Canon Promotion Preview

**Files:**

- Modify: `src/memory/canon.mjs`
- Modify: `src/cli.mjs`
- Modify: `docs/commands.md`
- Modify matching Korean translations
- Test: `test/cli.test.mjs`

**Steps:**

1. `canon promote <target> --source <runtime-report> --to <memory-path>` preview mode failing test를 추가합니다.
2. 기본 mode가 파일을 쓰지 않고, promotion destination이 `.ai-agent-playbook/memory/` 또는 `.ai-agent-playbook/knowledge/references/` 밖이면 거부하는지 확인합니다.
3. Preview behavior가 안정된 뒤에만 `--apply` test를 추가합니다.
4. Proposed file path, source report, fact ids, warnings, conflicts를 포함하는 preview output을 구현합니다.
5. Reviewed fact에 대해서만, 그리고 허용된 memory/knowledge path 내부에서만 `--apply`를 구현합니다.
6. Promoted file frontmatter 또는 metadata block에 compact audit note를 추가합니다.
7. Targeted test와 full checks를 실행합니다.
8. Promotion slice를 commit합니다.

## Task 6: Add Backend And Security Capability Pack

**Files:**

- Create or modify primary skills under `skills/backend/`, `skills/security/`, and `references/stacks/`
- Modify compatibility wrappers only when existing skill names require routing
- Modify `docs/skill-taxonomy-v2.md`
- Modify `README.md` if public category counts or examples change
- Modify matching Korean translations
- Test: skill validation scripts

**Steps:**

1. `catalog check`로 기존 backend/security skill과 wrapper를 inventory합니다.
2. API contract review, auth/authz review, dependency and SBOM/license review, backend change safety, server-rendered flow safety용 primary skill을 추가합니다.
3. Java, Kotlin, Go, Python, Node, .NET, PHP 세부사항은 stack reference로 옮깁니다.
4. `SKILL.md`는 trigger 중심으로 유지하고 깊은 절차는 one-level reference로 보냅니다.
5. Korean skill translation과 reference translation을 갱신합니다.
6. 아래를 실행합니다.

   ```powershell
   .\scripts\validate-skills.ps1
   .\scripts\validate-translations.ps1
   .\scripts\sync-skills.ps1 -WhatIf
   ```

   Expected: skill과 translation validation이 통과합니다.

7. Capability pack slice를 commit합니다.

## Final Verification For This Plan

모든 slice 완료 후 실행합니다.

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
git diff --check
```

Expected: 모든 check가 통과하고 staged file은 의도한 AI Agent Playbook transaction, canon, skill, MCP, docs, translation 변경만 포함합니다.
