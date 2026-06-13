# Runtime Harness V20-V22 Memory Structure

## 목표

미래 에이전트가 큰 프로젝트를 더 잘 이어받고, 근거를 확인하고, 오래 남길 제약을 이해할 수 있도록 project memory 구조를 보강합니다.

기본 경로는 CLI 우선, 명시 실행, local-only, 쓰기 명령은 preview-first, no-network를 유지합니다. 이 계획에는 blocking hook, 자동 doctor 실행, continuation, LLM judge, slash command를 넣지 않습니다.

## 범위

### V20: path-scoped context와 documentation map

- `.ai-playbook/context/`를 path-scoped project memory 영역으로 승격합니다.
- Context markdown frontmatter `id`, `globs`, `alwaysApply`, `freshness`, `priority`를 지원합니다.
- `context list`, `context status`, preview-first `context init`을 추가합니다.
- 오래 남길 documentation map으로 `.ai-playbook/maps/doc-map.md`를 추가합니다.
- `operator context`에 doc-map과 context metadata를 포함합니다.

### V21: runs evidence ledger

- 진행 중 작업 상태를 위해 `.ai-playbook/runs/<run-id>/`를 추가합니다.
- `run start`, `run status`, `run record`, `run summarize`를 추가합니다.
- `ledger.jsonl`은 append-only로 유지합니다.
- Run record에서 로컬 절대경로와 credential처럼 보이는 message를 거부합니다.
- Worklogs는 오래 남길 history로 유지하고, runs는 active-task evidence로 둡니다.

### V22: contracts read-only layer

- Active/pending business rule 또는 invariant를 위한 `.ai-playbook/contracts/`를 추가합니다.
- Contract frontmatter `id`, `status`, `appliesTo`, `risk`, `approvedAt`, `freshness`를 지원합니다.
- `contracts list`, `contracts check`, preview-first `contracts init`을 추가합니다.
- Check는 read-only로 유지합니다. 오래된 항목, pending match, missing path, missing evidence signal만 보고하고 판단하거나 막지 않습니다.

## 테스트 계획

- Context frontmatter matching, dry-run/no-write 동작, Windows-style path input, 공백 path, 비ASCII path fixture test를 추가합니다.
- Run ledger dry-run, 구조 생성, append-only event 기록, unsafe text 거부, status summary, summarize preview test를 추가합니다.
- Contract active/pending listing, path matching, stale freshness, missing appliesTo path, missing evidence, no-write check test를 추가합니다.
- Merge 전 전체 repository test와 validation suite를 실행합니다.

## 범위 밖

- Hook 설치 없음.
- Blocking hook behavior 없음.
- 자동 doctor 실행 없음.
- Continuation 없음.
- LLM judge 없음.
- Network research 없음.
- Worklog 대체 없음.
