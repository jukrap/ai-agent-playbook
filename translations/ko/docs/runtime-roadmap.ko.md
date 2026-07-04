# 런타임 로드맵

이 로드맵은 현재 문서와 CLI 하네스를 강화하면서 선택적 런타임 hook layer를 얇은 adapter로 추가하는 방법을 설명합니다.

기본 경로는 단순하게 유지합니다. 스킬을 설치하고, 대상 프로젝트에 필요할 때 `.ai-agent-playbook/`을 bootstrap하고, `doctor`를 실행하고, plan과 worklog를 예측 가능한 위치에 만들고, 프로젝트 규칙을 파일에 명시적으로 둡니다. Runtime hook은 이를 지원하는 환경에서만 쓰는 선택 확장입니다.

## 목표

- Runtime 자동화를 추가하기 전에 문서 하네스를 더 안전하게 만듭니다.
- CLI를 결정적이고, 의존성이 적고, 파일 시스템 중심으로 유지합니다.
- Runtime-specific 동작을 기본 템플릿 밖에 둬 에이전트 간 이식성을 유지합니다.
- 향후 hook 기반 연동이 tool output을 다시 쓰거나 project file을 자동 변경하지 않고 context 또는 reminder만 주입할 수 있게 합니다.

## 현재 장점

- `bootstrap`은 stack을 가정하지 않고 얇은 root `AGENTS.md`와 project-memory `.ai-agent-playbook/` 폴더를 만듭니다.
- `bootstrap`은 예정된 쓰기 작업을 먼저 점검해 기존 프로젝트 충돌이 부분적인 playbook output을 남기지 않게 합니다.
- `doctor`는 최소 layout, root policy 위치, local-only 정책, template adaptation, worklog summary freshness, obsolete skill reference, fixed local path를 이미 점검합니다.
- `guides sync`는 기본적으로 local edit을 교체하지 않고 누락된 guide template만 추가하며, `guides sync --check --diff --json`은 source와 target hash와 첫 차이 line으로 stale guide를 보고합니다.
- `migrate path`는 legacy `ai-playbook/`에서 `.ai-agent-playbook/`로의 폴더 이동, 참조 갱신, `.gitignore` 전환을 preview하고 필요할 때만 적용합니다.
- `context`, `run`, `contracts`, `plan`, `worklog`, `worklog summarize`는 path-scoped memory, working vocabulary, active evidence, contract note, plan, 상세 이력, 월간 summary를 예측 가능한 경로에 둡니다.
- `managed check`, `managed catalog`, `managed adopt`, `managed prune`, `managed uninstall`은 project-level marker를 사용해 이 playbook이 복사한 수정되지 않은 파일만 확인, cataloging, 채택, 선택 제거, 전체 제거합니다.
- `context status`, `run status`, `contracts check`, `contracts snapshot`, `operator check`, `operator search`, `operator preflight`, `operator delta`, `operator context`, `operator analyze`, `operator map`, `operator audit`, `operator gc`, `rules check`, `diagnostics check`, `skills lint`, `qa tui-check`, `qa image-diff`는 path-scoped memory, run evidence, contract freshness, combined health review, local search, before/after evidence comparison, context preview, analysis signal aggregation, codebase mapping, playbook drift audit, preview-first managed cleanup, rule matching, verification command discovery, skill quality review, terminal/CJK layout evidence, 작은 PNG 비교를 위한 operator-triggered diagnostics를 제공합니다.
- `aapb mcp`는 agent app이 slash command나 원격 서버 없이 context, operator diagnostics, search, contracts, managed state, QA, AST search, 정확한 함수 본문 중복 단서, TypeScript/JavaScript analysis를 호출할 수 있는 로컬 read-only MCP 도구 표면을 제공합니다.
- `operator analyze --deep`은 기본 `operator analyze` 경로를 가볍게 유지하면서 명시적으로 AST-grep, 정확한 함수 본문 중복 단서, TypeScript/JavaScript 언어 분석 signal을 추가합니다.
- Installer와 updater는 managed marker와 hash를 사용해 local skill edit과 unmanaged same-name skill을 조용히 덮어쓰지 않습니다.
- `doctor --json`, `doctor --reminder --json`, `guides sync --check --json`, `context --json`, `adapter config --json`, `adapter check --json`은 향후 adapter가 읽을 수 있는 작은 machine-readable core를 제공합니다.

## 문서 하네스 강화

Hook을 기본 설치 경로에 넣기 전까지 아래 영역을 계속 강화합니다.

- `doctor` check id, severity, actionable message, strict/non-strict exit behavior를 안정적으로 유지합니다.
- `doctor` warning category를 setup health, adaptation reminder, local-only policy, public-safety finding으로 분리해 유지합니다.
- 기존 프로젝트에는 `bootstrap` dry run을 먼저 사용하고, conflict output을 migration note로 옮기기 쉽게 유지합니다.
- `--force`는 검토한 overwrite에만 제한합니다. Migration을 위해 넓은 force를 쓰지 않습니다.
- Guide manifest를 유지해 `guides sync --check --json`이 project-specific edit을 덮어쓰지 않고 stale guide를 보고할 수 있게 합니다.
- Stale guide file을 덮어쓰기 전에는 `guides sync --check --diff --json`으로 local edit을 눈에 보이게 합니다.
- Legacy folder move는 적용 전에 `migrate path --json`으로 확인해 path 변경이 명시적이고 일반 Git review로 되돌릴 수 있게 합니다.
- Cleanup 전에는 `managed check`와 `managed catalog`를 사용하고, 선택 managed removal 전에는 `managed prune --json`, 전체 managed removal 전에는 `managed uninstall --json`을 사용합니다.
- 더 강한 runtime automation을 검토하기 전에 `context status --path`, `run status`, `contracts check --path`, `contracts snapshot --json`, `operator check --path`, `operator search --query`, `operator preflight --intent`, `operator delta --before`, `operator context --path`, `operator analyze --path`, `operator map`, `operator audit`, `operator gc`, `rules check --path`, `diagnostics check`, `skills lint`, `qa tui-check`, `qa image-diff`를 operator-visible evidence로 사용합니다.
- 더 강한 로컬 분석이 scan 비용을 감수할 만큼 필요할 때만 `operator analyze --deep`, `source_function_clones`, `ast_grep_search`, read-only `lsp_*` MCP 도구를 사용합니다.
- 기존 agent docs migration은 history를 보존하고, current rule을 분류하고, 남은 불확실성을 `.ai-agent-playbook/questions.md`에 기록합니다.
- `worklog summarize`는 승격 checkpoint로 다룹니다. Durable fact는 history에만 두지 말고 `CURRENT.md`, maps, runbooks, decisions로 옮깁니다.

## 선택적 런타임 레이어

Runtime hook은 문서 하네스 위에 얇은 adapter로 설계합니다.

- **Plugin shell:** 안정된 계약이 생기기 전까지 기본 installer에 넣지 않는 opt-in 패키지 또는 adapter folder.
- **Session hooks:** `SessionStart`는 native agent context만으로 부족할 때 `.ai-agent-playbook/`의 작은 project reminder를 불러올 수 있습니다. `UserPromptSubmit`은 opt-in으로 유지하며 handoff-like prompt에 짧은 guardrail reminder만 출력합니다.
- **Post-edit hooks:** `PostToolUse`는 opt-in으로 유지하며 successful edit-like operation 뒤 changed path를 읽을 수 있을 때만 file-specific reminder를 주입할 수 있습니다. Tool output을 다시 쓰거나 file을 편집하지 않습니다.
- **Compaction hooks:** `PostCompact`는 context compaction 뒤 compact playbook context를 다시 소개할 수 있습니다.
- **Rules loader:** Project playbook file과 선택적 rule folder에서 portable rule source를 읽습니다. Agent가 `AGENTS.md`를 native로 이미 읽는다면 기본적으로 다시 주입하지 않습니다.
- **MCP layer:** `aapb mcp`는 local stdio server와 read-only 도구로 먼저 유지합니다. Write, rewrite, rename, install, blocking 동작은 별도 설계 검토 전에는 노출하지 않습니다.
- **Context injector:** Runtime이 지원하는 hook JSON contract로 additional context만 출력하고 debug log는 stderr에 둡니다.
- **Doctor reminder:** 매 session마다 전체 check를 자동 실행하기보다 작은 `doctor --reminder --json` signal 또는 `doctor` 실행 reminder를 우선합니다. 비용과 소음이 검증된 뒤에만 자동 실행을 고려합니다.
- **Command layer:** 안정 호출은 `node .\bin\aapb.mjs ...`로 유지합니다. Global command와 plugin command는 편의 기능일 뿐입니다.

## Runtime-first 위험

- Hook API와 plugin 설치 동작은 agent와 app version마다 다를 수 있습니다.
- Native project instruction과 hook-injected context가 중복되거나 충돌할 수 있습니다.
- 자동 check는 시끄럽거나 느리거나 잘못된 working directory에서 실행될 수 있습니다.
- Plugin installer는 사용자 설정을 바꿀 수 있어 project template 복사보다 위험합니다.
- Public docs가 portable playbook 원칙 대신 특정 외부 harness model을 고정할 수 있습니다.
- Runtime state가 `.ai-agent-playbook/`에 보여야 할 결정을 숨길 수 있습니다.

## 경계

- 문서 하네스는 project memory, source-of-truth rule, migration, worklog, 명시적 verification command를 맡습니다.
- CLI는 deterministic scaffolding, health check, guide synchronization, 예측 가능한 file creation을 맡습니다.
- 선택적 runtime hook은 reminder, context injection, 반복 guidance deduplication, diagnostics report를 할 수 있습니다.
- 선택적 runtime hook이 project policy의 유일한 위치가 되어서는 안 됩니다.
- Skill은 재사용 작업 가이드이고, template은 project-copyable standing instruction입니다.

## Codex App 제약

Codex App 호환성을 위해 향후 plugin 또는 hook PoC는 아래를 지켜야 합니다.

- 가능하면 Node로 실행하고 shell-specific 기능을 피합니다.
- Hook command는 짧게 끝나야 하며 timeout은 보수적으로 둡니다.
- Hook JSON은 stdout에만 쓰고 debug 정보는 stderr에만 씁니다.
- Windows path, 공백, 비ASCII project path를 처리합니다.
- Global command 요구를 피합니다.
- 기본적으로 network call을 하지 않습니다.
- Opt-in behavior는 environment variable로 제어합니다.
- Plugin hook을 사용할 수 없으면 조용히 건너뛰거나 작은 reminder만 남깁니다.

## Adapter PoC

첫 adapter proof of concept는 의도적으로 read-only입니다.

- `adapters/codex/hook.mjs`는 `SessionStart`와 `PostCompact`에서 `hookSpecificOutput.additionalContext`를 출력합니다.
- `adapters/claude-code/hook.mjs`는 Claude Code의 hook JSON 계약에 맞춰 같은 core context builder를 사용합니다.
- 두 wrapper 모두 shared `context` core를 호출하며, project file을 편집하지 않고, network call을 하지 않고, `.ai-agent-playbook/`이 없으면 조용히 빠집니다.
- 예시 hook 설정은 각 adapter 옆에 있으며 자동 설치되지 않습니다.
- `adapter config`는 이 checkout의 hook path를 사용해 검토 가능한 local settings를 렌더링하며, 파일을 쓰지 않고 `.ai-agent-playbook/`이 먼저 있어야만 동작하지도 않습니다.
- `adapter check`는 사용자가 adapter를 수동으로 켜기 전에 read-only wrapper, 예시 설정, 지원 hook event, quiet unsupported path를 검증합니다.
- `adapter check --settings <path>`는 수동으로 편집한 local settings file을 파일 쓰기 없이 검증합니다.
- `AI_AGENT_PLAYBOOK_HOOK_EVENTS`로 `UserPromptSubmit`, `PostToolUse`, `Stop` reminder를 opt in할 수 있습니다. 관련 없는 prompt, missing playbook, unsupported payload, non-edit tool에서는 조용히 빠집니다.
- `Stop`은 non-blocking handoff reminder일 뿐이며 continuation을 요청하거나 doctor를 실행하지 않습니다.
- Adapter-local package shell entrypoint는 packaging smoke test를 위해 같은 hook, config, check helper를 노출하지만 자동 설치되지 않습니다.

## 다음 중간 단계

전체 plugin 없이 먼저 구현할 수 있는 항목입니다.

- 구체적인 V4+ 실행 계획과 다음 session handoff는 `plans/2026-06-11-runtime-harness-v4-plus.ko.md`를 봅니다.
- 렌더링된 adapter 설정이 실제 프로젝트에서 설정 실수를 줄이고 noise를 늘리지 않는지 확인.
- `migrate path --json`이 실제 프로젝트에서 흔한 legacy path reference를 관련 없는 파일을 건드리지 않고 잡아내는지 확인.
- Managed marker, managed catalog, selected managed prune, combined operator check, local search, preflight/delta evidence comparison, contract hash snapshot, path-scoped context preview, analysis signal aggregation, codebase map summary, playbook drift audit, preview-first managed cleanup, rule matching, diagnostics command discovery, skill linting, TUI layout check, PNG image comparison이 hook-driven diagnostics로 승격하기 전에 review miss를 줄이는지 확인.
- MCP 도구 사용이 명령어 암기 부담을 줄이면서도 `.ai-agent-playbook/`에 남겨야 할 결정을 숨기지 않는지 확인.
- 아직 신중해야 하는 후보: 비용과 소음이 검증된 뒤의 continuation, blocking feedback, 자동 doctor 실행.

## 작업 흐름 스킬 호환성

외부 작업 흐름 스킬은 agent가 어떻게 계획, 테스트, 디버깅, 리뷰, branch 마무리를 할지 결정할 수 있습니다. 이 playbook은 project memory, bootstrap, doctor check, skill policy, Git/worklog policy, migration guidance 같은 저장소 guardrail을 제공합니다.

Runtime hook도 같은 분리를 따라야 합니다. 저장소 guardrail을 강화할 수는 있지만, process skill의 planning, TDD, debugging, review workflow를 대체해서는 안 됩니다.

## 검증 전략

Roadmap과 문서 변경에는 아래를 실행합니다.

```powershell
npm run check
npm test
.\scripts\validate-skills.ps1
.\scripts\validate-translations.ps1
.\scripts\sync-skills.ps1 -WhatIf
```

향후 CLI 변경에는 새 option, output shape, overwrite rule, path convention마다 Node test를 추가합니다.

향후 runtime hook PoC에는 각 hook payload의 fixture 기반 smoke test를 추가하고, hook이 지원되는 JSON만 출력하며 file을 편집하지 않고 opt-out 설정을 존중하는지 검증합니다.
