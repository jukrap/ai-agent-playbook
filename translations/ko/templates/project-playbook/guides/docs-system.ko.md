# 프로젝트 문서 체계

프로젝트 전용 에이전트 문서를 정리할 때 사용합니다.

## 문서 역할

- `AGENTS.md`: 에이전트 작업 흐름, 검증, 커밋, 협업 규칙.
- `ai-playbook/SKILLS.md`: 프로젝트 수준 스킬 선택 정책.
- `ai-playbook/GIT.md`: 짧은 Git, commit, PR, push 정책.
- `README.md`: 사람을 위한 공개 setup/run guide.
- `PROJECT_SPEC.md`: 프로젝트가 사용할 때 제품 목표, 기능/화면 범위, API/data 정책.
- `PLANS.md`: 프로젝트가 사용할 때 마일스톤 순서, 완료 기준, 검증 명령.
- `FSD.md`: 프로젝트가 해당 아키텍처를 증명할 때만 FSD 또는 아키텍처 경계 규칙.
- `ai-playbook/`: 에이전트용 프로젝트 메모리, map, runbook, plan, decision, worklog.

## Source of truth

1. 최신 사용자 지시.
2. 실제 코드와 설정.
3. 프로젝트 전용 명세와 계획 문서.
4. 가장 가까운 `AGENTS.md`.
5. 전역 작업 규칙.
6. 오래된 참고 자료.

## 정리 규칙

- `AGENTS.md`는 작업 방식에 집중합니다.
- 현재 프로젝트 사실은 `ai-playbook/CURRENT.md`에 둡니다.
- 구조 사실은 `ai-playbook/maps/`에 둡니다.
- 반복 명령은 `ai-playbook/runbooks/`에 둡니다.
- 진행 중 계획은 `ai-playbook/plans/`에 둡니다.
- 상세 이력은 `ai-playbook/worklogs/`에 둡니다.
- 오래된 계획, 프롬프트, 인수인계는 보관합니다.

## 로컬 전용 정책

`ai-playbook/`을 commit할지 로컬 전용으로 둘지 결정합니다. 로컬 전용이라면 private project facts를 쓰기 전에 `.gitignore`에 추가합니다.

commit 전 staged markdown file을 확인하고 로컬 전용 note, 생성물, private reference, 민감한 log를 stage하지 않습니다.
