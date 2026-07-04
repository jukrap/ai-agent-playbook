# 구조화 플레이북 전환 기록

이 문서는 구조화된 `.ai-agent-playbook/` 표면을 도입한 레이아웃과 런타임 재정렬의 변경 기록입니다.

현재 기준 문서는 레이아웃, 능력 분류, 런타임 동작, MCP 권한, 저장소 분류 문서로 나뉘어 있습니다. 이 기록을 평소 작업의 기준 문서처럼 사용하지 않습니다.

## 바뀐 점

- `.ai-agent-playbook/`이 유일한 활성 프로젝트 플레이북 루트가 됐습니다.
- 기존 `ai-playbook/` 폴더는 명시적인 `migrate path` 명령에서만 다룹니다.
- 상위 플레이북 파일을 `policy/`, `memory/`, `workflows/`, `knowledge/`, `runtime/`, `integrations/` 아래로 정리했습니다.
- 도구가 만든 런타임 산출물은 검토된 프로젝트 기억과 계속 분리합니다.
- MCP 리소스와 CLI 레이아웃 보고는 구조화 레이아웃 언어를 사용합니다.

## 현재 기준 문서

- 레이아웃과 전환 명령: `docs/structured-playbook-layout.ko.md`.
- 능력과 스킬 분류: `docs/capability-taxonomy.ko.md`.
- 런타임 동작과 기억 승격: `docs/harness-runtime.ko.md`.
- MCP 권한 경계: `docs/mcp-permission-model.ko.md`.
- 저장소 내용의 역할: `docs/classification.ko.md`.
