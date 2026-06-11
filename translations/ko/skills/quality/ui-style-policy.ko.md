# UI Style Policy

visible UI를 바꾸기 전에 repository evidence로 하나의 project styling policy를 선택합니다.

## 진행 절차

1. project docs, shared UI primitives, tokens, existing components, stylesheets, utilities, inline style usage를 확인합니다.
2. shared components, variants, slots, tokens가 UI surface를 담당한다면 existing design system을 먼저 사용합니다.
3. 프로젝트가 이미 쓰는 custom styling layer를 고릅니다: CSS/classes, utility classes, inline style objects.
4. 한 작업 때문에 parallel styling method를 새로 도입하지 않습니다.
5. 프로젝트에 guidance가 없고 나중에도 중요하다면 root instructions 또는 `.ai-playbook/`에 durable policy decision을 기록합니다.
6. policy를 선택한 뒤 visible, responsive, overflow, state review에는 `style-quality-review`를 사용합니다.

## 참고 자료

policy가 불분명하거나 conflicting style guidance를 정리할 때 `references/style-policy.md`를 읽습니다.
