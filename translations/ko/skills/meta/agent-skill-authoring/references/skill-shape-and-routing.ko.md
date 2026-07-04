# 스킬 형태와 라우팅

설치형 스킬을 설계하거나 검토할 때 사용합니다.

## 권장 구조

```text
skills/<category>/<skill-name>/
  SKILL.md
  references/<detail>.md
  scripts/<tool>
  agents/openai.yaml
```

필수 파일은 `SKILL.md`뿐입니다. 다른 파일은 명확한 실행 또는 작성 목적이 있을 때 추가합니다.

## 스킬 본문

- Frontmatter는 `name`과 `description`만 포함합니다.
- `description`은 `Use when...`으로 시작합니다.
- description은 내부 절차가 아니라 불러올 조건을 설명합니다.
- 본문은 핵심 절차와 참고 자료 라우팅을 담습니다.
- 긴 체크리스트, 예시, 스택 세부사항, provider별 규칙은 참고 자료에 둡니다.

## 라우팅 결정

- capability-first 스킬이 기본 동작을 소유합니다.
- 스택 이름, 옛 이름, 제품별 이름은 고유한 capability를 정의하지 않는 한 wrapper 또는 참고 자료로 둡니다.
- 호환 wrapper는 기본 스킬로 라우팅하고 기존 트리거 이름을 보존합니다.
- 기존 스킬과 다른 guidance를 안정적으로 불러와야 하는 사용자 요청이 있을 때 새 스킬이 정당화됩니다.

## 충돌 점검

- 새 스킬을 추가하기 전에 기존 스킬 이름과 description을 검색합니다.
- 있을 법한 요청과 아슬아슬한 비적용 사례로 트리거를 테스트합니다.
- 해당 규칙이 프로젝트 템플릿, 로컬 playbook, 참고 자료, workflow recipe에 더 적합한지 확인합니다.
- 명확한 우선순위 설명 없이 여러 스킬이 같은 트리거 단어를 주장하지 않게 합니다.

## 검토 산출물

작지 않은 스킬 추가에는 다음을 기록합니다.

- capability category.
- 기본 트리거.
- 추가한 참고 자료.
- 영향을 받는 호환 이름.
- 검증과 번역 상태.
