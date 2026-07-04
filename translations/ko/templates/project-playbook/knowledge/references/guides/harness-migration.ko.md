# 하네스 마이그레이션

프로젝트에 이미 에이전트 문서, 로컬 스킬 지침, 다른 하네스, 흩어진 AI 계획 파일이 있을 때 사용합니다.

목표는 기존 체계를 지우는 것이 아닙니다. 쓸 만한 근거와 기록은 보존하고, 오래 유지해야 할 프로젝트 메모리를 예측 가능한 위치로 옮기며, 낡은 지침과 현재 규칙이 섞이지 않게 만드는 것입니다.

## 안전 규칙

- 첫 점검에서 기존 에이전트 문서, 프롬프트, 작업 기록, 계획서를 삭제하지 않습니다.
- 명시적인 승인 없이 `AGENTS.md`, `CLAUDE.md`, `.ai-playbook/policy/SKILLS.md`, `.ai-playbook/policy/GIT.md`, 프로젝트 문서를 덮어쓰지 않습니다.
- 충돌을 없애려고 넓은 범위의 `--force` 마이그레이션을 실행하지 않습니다.
- 저장소가 명시적으로 커밋하기로 정한 자료가 아니라면, 비공개 맥락은 로컬 전용으로 둡니다.
- 현재 지침으로는 낡았더라도 과거 작업 기록은 보존합니다.

## 첫 점검

1. 루트 파일을 확인합니다: `AGENTS.md`, `CLAUDE.md`, `README.md`, `.gitignore`. `.ai-playbook/policy/SKILLS.md`와 `.ai-playbook/policy/GIT.md`가 있으면 함께 확인합니다.
2. 기존 AI 문서를 찾습니다: `docs/**`, `docs/agents/**`, `docs/plans/**`, `docs/worklog/**`, `.cursor/**`, `.windsurf/**`, `.github/copilot-instructions.md`, 그 밖의 비슷한 이름의 로컬 폴더.
3. 어떤 문서가 커밋 대상인지, ignore 대상인지, 생성물인지, 비공개 자료인지 구분합니다.
4. 충돌과 불확실한 점은 `.ai-playbook/questions.md`에 기록합니다.
5. 첫 복사 뒤 `doctor`를 실행해 빠진 구조와 낡은 참조를 확인합니다.

## 분류 기준

문서 역할에 따라 옮기거나 복사합니다.

- 루트 진입점: `AGENTS.md`에는 최소 agent bootstrap만 두고, 현재 동작, 검증 정책, 기준 우선순위의 상세 내용은 `.ai-playbook/`에 둡니다.
- 스킬 선택 규칙: 재사용 스킬을 언제 읽을지에 대한 정책은 `.ai-playbook/policy/SKILLS.md`에 둡니다.
- Git과 PR 정책: 커밋, PR, push, worklog 기대치는 `.ai-playbook/policy/GIT.md` 또는 `.ai-playbook/knowledge/references/guides/commit-push-worklog.md`에 둡니다.
- 현재 프로젝트 사실: 활성 아키텍처, 제품 제약, 확인된 명령은 `.ai-playbook/CURRENT.md`에 둡니다.
- 저장소 지도: 중요한 코드 위치는 `.ai-playbook/memory/maps/`에 둡니다.
- 반복 절차: 설정, 배포, 데이터 import, 디버깅, 수동 검증 흐름은 `.ai-playbook/workflows/runbooks/`에 둡니다.
- 결정 기록: 오래 유지할 아키텍처 또는 프로세스 결정은 `.ai-playbook/memory/decisions/`에 둡니다.
- 진행 중 계획: 아직 끝나지 않은 구현 계획은 `.ai-playbook/workflows/plans/`에 둡니다.
- 작업 이력: 날짜가 있는 판단 과정, blocker, 검증, handoff는 `.ai-playbook/workflows/worklogs/YYYY-MM/`에 둡니다.
- 오래되었거나 불확실한 자료: `.ai-playbook/archive/`에 보관하거나, 현재 기준 문서를 가리키는 메모를 남긴 뒤 원래 위치에 둡니다.

## 마이그레이션 절차

1. 먼저 `--dry-run`으로 bootstrap 결과를 봅니다.
2. 루트 파일이 충돌하면 강제로 덮어쓰지 않습니다. 빠진 `.ai-playbook/` 파일을 생성한 뒤 루트 정책은 수동으로 병합합니다.
3. `guides sync`로 가이드를 추가하거나 보강합니다. 이 명령은 프로젝트별 메모리를 다시 쓰기 위한 명령이 아닙니다.
4. `.ai-playbook/workflows/worklogs/YYYY-MM/`에 짧은 마이그레이션 기록을 만들고, 무엇을 옮겼는지, 무엇을 남겼는지, 무엇을 더 검토해야 하는지 적습니다.
5. 오래된 계획과 worklog에서 아직 유효한 사실만 `CURRENT.md`, maps, runbooks, decisions로 승격합니다.
6. 새 기준 문서가 명확해진 뒤에만 낡은 지침을 archive로 보냅니다.

## 명령

이 playbook 저장소에서 실행합니다.

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-project> --local-only --dry-run
node .\bin\ai-playbook.mjs guides sync <target-project> --dry-run
node .\bin\ai-playbook.mjs doctor <target-project>
```

dry run 결과가 괜찮으면 실행합니다.

```powershell
node .\bin\ai-playbook.mjs bootstrap <target-project> --local-only
node .\bin\ai-playbook.mjs guides sync <target-project>
node .\bin\ai-playbook.mjs worklog new <target-project> --title "Harness migration"
```

`--force`는 검토가 끝난 특정 덮어쓰기에만 사용합니다. 프로젝트에 가치 있는 루트 지침이 이미 있다면 손으로 병합합니다.

## handoff 프롬프트

대상 프로젝트에 이 가이드가 들어간 뒤, 다른 에이전트에게 이렇게 요청할 수 있습니다.

```text
AGENTS.md, .ai-playbook/policy/SKILLS.md, .ai-playbook/policy/GIT.md, .ai-playbook/README.md, .ai-playbook/START_HERE.md,
.ai-playbook/CURRENT.md, .ai-playbook/questions.md, .ai-playbook/knowledge/references/guides/harness-migration.md를 읽어라.

기존 에이전트 문서와 markdown 계획 파일을 점검하라. 첫 단계에서 기존 자료를 삭제하거나
덮어쓰지 마라. 각 문서를 현재 루트 규칙, 현재 프로젝트 사실, 지도, 반복 절차, 결정 기록,
진행 중 계획, 작업 이력, archive, 외부 참고 자료 중 하나로 분류하라.

먼저 마이그레이션 계획을 제안하라. 승인 뒤에만 검토된 파일을 옮기거나 복사하고,
이력은 보존하며, 날짜가 있는 worklog에 마이그레이션 내용을 기록하라.
```

## 완료 기준

- `AGENTS.md`가 `.ai-playbook/`을 가리키며, `.ai-playbook/policy/SKILLS.md`와 `.ai-playbook/policy/GIT.md`가 있거나 만들지 않는 명확한 이유가 있습니다.
- `.ai-playbook/START_HERE.md`, `CURRENT.md`, `questions.md`가 현재 프로젝트 상태를 반영합니다.
- 기존 지침은 병합되었거나, archive로 이동했거나, 과거 기록으로 표시되어 있습니다.
- 진행 중 계획과 worklog가 예측 가능한 `.ai-playbook/` 경로 아래에 있습니다.
- `doctor`를 실행했고, 남은 경고가 문서화되어 있습니다.
