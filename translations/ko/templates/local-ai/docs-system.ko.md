# Project Docs System

프로젝트별 AI 문서를 정리할 때 사용합니다.

## 문서 역할

- `AGENTS.md`: 에이전트 작업 흐름, 검증, 커밋, 협업 규칙.
- `README.md`: 신규 개발자를 위한 공개 setup/run 안내.
- `PROJECT_SPEC.md`: 제품 목표, 기능/화면 범위, API/data 정책.
- `PLANS.md`: 마일스톤 순서, 완료 기준, 검증 명령.
- `FSD.md`: 필요할 때 FSD 또는 아키텍처 경계 규칙.
- `docs/plans/README.md`: 로컬 계획 문서 색인과 읽는 순서.
- `docs/plans/CONVENTIONS.md`: 코딩 규칙.
- `docs/plans/AGENT_SKILL_USAGE.md`: 어떤 스킬을 언제 쓸지.
- `docs/plans/TEMPLATES.md`: 반복 가능한 slice/task 템플릿.
- `.local-ai/structural-review.md` 또는 `docs/plans/STRUCTURAL_REVIEW.md`: 저장소 전체 구조와 정리 리뷰용 근거 규칙.
- `docs/worklog/**`: 마일스톤 완료, blocker, 큰 방향 변경.
- `design-docs/**`, `_reference/**`: 보조 참고 자료.

## 기준 우선순위

1. 최신 사용자 지시.
2. 실제 코드와 설정.
3. 프로젝트별 명세와 계획 문서.
4. 가장 가까운 하위 `AGENTS.md`.
5. 전역 작업 규칙.
6. 오래된 참고 자료.

문서와 코드가 다르면 코드를 확인하고 문서 갱신 필요성을 명시합니다.

## Local-only 정책

AI 작업 메모, 작업 기록, 내부 계획, 디자인 원본, 실험 자료는 local-only일 수 있습니다. 프로젝트가 local-only로 표시한 파일은 커밋하지 않습니다.

권장 guard:

```bash
git diff --cached --name-only
git ls-files '*.md' 'docs/*' 'design-docs/*' '_reference/*'
```

local-only 파일을 막는 hook을 우회하지 않습니다.

## 정리 규칙

- `AGENTS.md`는 작업 방식에 집중합니다.
- 제품 요구사항은 `PROJECT_SPEC.md`에 둡니다.
- 마일스톤과 검증 기준은 `PLANS.md`에 둡니다.
- 날짜가 박힌 인수인계와 프롬프트는 활성 정책이 아니라 참고 자료로 둡니다.
- 같은 규칙을 여러 파일에 반복하지 말고 색인 문서에서 연결합니다.
