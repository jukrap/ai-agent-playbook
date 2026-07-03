# Runtime Harness V16-V18 Quality and Analysis Track

**목표:** 기본 operator-controlled document/CLI harness를 바꾸지 않으면서 유용한 품질 및 분석 아이디어를 이 playbook에 맞게 흡수합니다.

**구조:** Skill은 재사용 guidance로, CLI command는 명시적 operator action으로, hook은 선택적 read-only reminder로 유지합니다. Slash command, plugin hook, language server, AST tool, network service, automatic continuation을 전제하거나 외부 process pack을 그대로 가져오지 않습니다.

## 요약

- V16은 기존 skills lifecycle로 설치할 수 있는 집중 품질 스킬을 추가합니다.
- V17은 read-only 동작과 optional tool availability 흐름이 명확해진 뒤 explicit analysis layer를 추가합니다.
- V18은 V16과 V17이 실제 프로젝트에서 low-noise로 유용하다고 확인된 뒤 optional hook reminder를 검토합니다.
- 전체 track은 portable하게 유지합니다. Automatic doctor execution, blocking hook, continuation, 숨은 write, 기본 network call을 넣지 않습니다.

## 원칙

- Quality checklist를 적용하기 전에 project instruction, 실제 code, 기존 style을 우선합니다.
- 재사용 skill은 짧고 trigger-focused하게 유지하고, checklist는 한 단계 아래 `references/`에 둡니다.
- Analysis tool은 optional accelerator로 취급합니다. AST 또는 LSP tooling이 없어도 playbook은 계속 사용할 수 있어야 합니다.
- Hook 승격 전에는 explicit CLI command를 먼저 사용합니다. 파일 변경 전 사람이 output을 검토할 수 있어야 합니다.
- Cleanup work는 behavior를 보존해야 하며, code refactor에는 test 또는 concrete evidence가 필요합니다.

## V16: Quality Skills

`skills/quality` 아래에 installable skill 세 개를 추가합니다.

- `frontend-ui-polish`: 보이는 UI surface를 구현하거나 다듬을 때 사용합니다. 현재 저장소의 design language에 맞추고 responsive/state behavior를 확인하며, generic decorative redesign을 피합니다.
- `cleanup-ai-slop`: AI가 만든 듯하거나 신뢰가 낮은 code를 behavior-preserving 방식으로 정리할 때 사용합니다. Scope 제한, behavior lock, small diff, verification을 요구합니다.
- `review-work-light`: 최근 구현 작업을 automatic blocking gate 없이 검토할 때 사용합니다. Regression, missing test, API/style drift, docs impact, follow-up risk에 집중합니다.

함께 갱신합니다.

- `README.md`
- `docs/classification.md`
- `translations/ko` 아래 한국어 번역

테스트:

- `validate-skills.ps1`
- `validate-translations.ps1`
- 기존 Node check와 test

## V17: Operator Analysis

Hook-driven diagnostic으로 승격하기 전에 explicit read-only analysis를 추가합니다.

후보 형태:

- `operator analyze <target> [--path <file>] [--json]`
- future optional `operator structural-search <target> --pattern <pattern> [--lang <lang>] [--json]`
- future optional `operator lsp <target> --path <file> [--json]`

규칙:

- Language server 또는 AST tool을 자동 설치하지 않습니다.
- Tool detection은 read-only이고 local입니다.
- Tool이 없으면 전체 harness를 실패시키지 않고 실행 가능한 setup guidance를 반환합니다.
- Structural replacement는 preview-only contract가 생길 때까지 범위 밖입니다.
- Rename 또는 workspace-edit operation은 default CLI 범위 밖입니다.

초기 output 후보:

- 감지된 language와 주요 config file;
- local verification command 후보;
- 특정 path와 관련된 playbook context, rules, maps, runbooks;
- optional external tool availability, version, suggested next command;
- operator가 별도 command를 명시적으로 실행하지 않는 한 write나 project command execution 없음.

테스트:

- 공백 path, Windows-style path, non-ASCII path를 포함한 no-write fixture;
- optional tool이 없을 때 crash가 아니라 warning 보고;
- path-scoped analysis가 context와 rule match를 포함;
- 새 output field마다 JSON schema assertion 추가.

## V18: Optional Hook Checks

Explicit command가 유용하고 low-noise임이 확인된 뒤에만 hook integration을 검토합니다.

후보 형태:

- opt-in `PostToolUse` reminder for edited files;
- opt-in comment-quality reminder;
- explicit CLI command를 가리키는 opt-in language diagnostic reminder;
- 기본값으로 blocking feedback 없음;
- automatic doctor execution 없음;
- file write 없음;
- network call 없음;
- unsupported payload, missing playbook, unrelated tool, missing optional analyzer에서는 quiet behavior.

승격 기준:

- explicit CLI check output이 명확하고 false positive가 낮습니다.
- real-project smoke test에서 reminder가 누락을 줄입니다.
- hook output이 native agent context를 밀어내지 않을 만큼 짧습니다.
- 같은 policy가 runtime state에만 있지 않고 `.ai-playbook/` 또는 public docs에도 남아 있습니다.

## 추가 개선

- 새 quality skill이 추가될 때 README skill catalog를 더 명확히 합니다.
- npm 패키지, 설치된 스킬, 대상 프로젝트 부트스트랩의 차이를 사용 수명주기 문서에서 계속 분명하게 설명합니다.
- English source가 바뀌면 Korean translation은 직역보다 읽기 쉽게 다듬습니다.
- Public docs에는 private path, branch name, PR number, credential, company name, internal URL, external harness-specific assumption을 넣지 않습니다.

## 범위 밖

- Slash command.
- 이 저장소의 agent plugin packaging.
- 외부 process skill pack vendoring.
- Blocking hook.
- Automatic continuation.
- Automatic doctor execution.
- AST rewrite 또는 LSP rename operation.
- Network-backed code search.

## 검증

Merge 전 실행:

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

Public docs를 publish 또는 merge하기 전에는 private path, branch name, PR number, credential, company name, internal URL, external harness name 검색도 실행합니다.
