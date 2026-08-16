# 변경 기록

이 문서는 배포된 사용자 영향 변경을 요약합니다. 현재 동작은 `docs/` 아래 기능·운영 문서를 기준으로 하며, 상세 배포 자료는 [GitHub Releases](https://github.com/jukrap/ai-agent-playbook/releases)에 둡니다.

## 0.5.11 (2026-08-15)

- 이미 `AGENTS.md`가 있는 저장소를 위한 명시적 보존, 관리 블록 연결, 보호된 교체 모드를 추가했습니다.
- 기존 `.gitignore`의 인코딩과 줄바꿈 선택을 유지하면서 누락된 로컬 플레이북 패턴만 추가하도록 했습니다.
- 일반적인 UI 후보 검사와 문서 수정 전후 충실도 근거를 읽기 전용으로 추가했습니다.
- 한국어 문서 검토를 반복, 밀도, 문맥, 보호할 사실 중심으로 보강했습니다.

[릴리스 상세](https://github.com/jukrap/ai-agent-playbook/releases/tag/v0.5.11)

## 0.5.10 (2026-07-19)

- GitHub/Gitea 호스팅 워크플로의 패키지 고정 버전과 Forge 요청 식별자를 배포 패키지 버전에 맞췄습니다.
- Python 인터프리터 후보 하나가 프로세스 생성에 실패해도 나머지 후보를 계속 탐색하도록 했습니다.

[릴리스 상세](https://github.com/jukrap/ai-agent-playbook/releases/tag/v0.5.10)

## 0.5.9 (2026-07-12)

- 재시도 예산 사용량과 단조 증가하는 시도 식별자를 분리해, 재개한 실행이 추가 전용 원장의 이벤트 ID를 재사용하지 않도록 했습니다.

[릴리스 상세](https://github.com/jukrap/ai-agent-playbook/releases/tag/v0.5.9)

## 0.5.8 (2026-07-12)

- Provider가 재사용 가능하다고 확인한 reconcile 작업을 적용 전에 no-op으로 분류했습니다.
- 호환되는 Project field, item, system 기본 View를 반복해서 쓰지 않고 재사용하도록 했습니다.
- 사용자가 쓴 본문을 보존하면서 기존 관리 영역만 엄격하게 전환하도록 했습니다.

[릴리스 상세](https://github.com/jukrap/ai-agent-playbook/releases/tag/v0.5.8)

## 0.5.7 (2026-07-12)

- 중단된 issue 통합 흐름을 CAS 안전 순서와 승인 marker 탐색으로 복구할 수 있게 했습니다.
- 실제 issue나 사용자 내용을 삭제하지 않고 오래된 Project item을 제거하도록 했습니다.

[릴리스 상세](https://github.com/jukrap/ai-agent-playbook/releases/tag/v0.5.7)

## 0.5.6 (2026-07-12)

- 첫 원격 변경 전에 실행 가능한 GitHub Projects 권한 복구 안내를 추가했습니다.
- Tool 이름이 붙은 Project field 기본값을 중립적인 delivery field로 바꾸고 기존 alias를 유지했습니다.
- 사용자 소유 Project View 요청이 GitHub 공개 API가 기대하는 owner login을 사용하도록 바로잡았습니다.

[릴리스 상세](https://github.com/jukrap/ai-agent-playbook/releases/tag/v0.5.6)

## 0.5.5 (2026-07-12)

- 세밀한 로컬 실행 task와 사람이 보는 roadmap·delivery-group issue를 분리했습니다.
- 검토 가능한 issue 본문, 명사형 제목 검사, Project field와 View, 보호된 기존 issue 통합을 추가했습니다.
- Merge 승인과 구현·검증·draft PR 전달을 별도 gate로 유지했습니다.

[릴리스 상세](https://github.com/jukrap/ai-agent-playbook/releases/tag/v0.5.5)

## 0.5.4 (2026-07-11)

- 재개 가능한 실행 원장, 한 task 단위 automation tick, controller 검증, 로컬 supervisor를 추가했습니다.
- Capability 기반 GitHub/Gitea 협업, 미리보기 우선 scheduler, 격리된 무인 workspace, draft PR 전달을 추가했습니다.
- 원격 협업을 사용할 수 없거나 금지한 경우에도 로컬 실행을 유지했습니다.

[릴리스 상세](https://github.com/jukrap/ai-agent-playbook/releases/tag/v0.5.4)

## 이전 릴리스

이전 이력은 [v0.5.3](https://github.com/jukrap/ai-agent-playbook/releases/tag/v0.5.3)과 [전체 릴리스 목록](https://github.com/jukrap/ai-agent-playbook/releases)에서 확인합니다.
