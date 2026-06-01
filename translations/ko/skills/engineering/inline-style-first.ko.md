# Inline Style First

UI 작업에서 repository가 component-local inline style을 명시적으로 선호하거나, 사용자가 inline-style-first convention을 따르라고 요청할 때 사용합니다.

## Workflow

1. project docs, existing code, 사용자 요청에서 inline-style-first convention을 확인합니다.
2. 수정 전 현재 component styling, shared primitives, tokens, CSS/class 사용 방식을 확인합니다.
3. component-local, dynamic, state-derived 값은 inline style object를 사용합니다.
4. 프로젝트가 이미 shared token, layout class, design-system variant에 의존하면 그대로 유지합니다.
5. 구체적인 충돌을 제거해야 하는 경우가 아니면 넓은 CSS/class refactor를 피합니다.
6. visible behavior가 바뀌면 rendered UI를 검증합니다.

## Coordination

일반적인 UI polish, responsive check, overflow fix, visual regression review에는 `style-quality-review`를 사용합니다.
