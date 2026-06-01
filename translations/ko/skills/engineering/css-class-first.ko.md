# CSS Class First

Repository가 stylesheet, CSS module, scoped CSS, semantic class name을 UI styling의 기본 방식으로 명시적으로 선호할 때 사용합니다.

## Workflow

1. project docs, existing code, 사용자 요청에서 CSS/class-first convention을 확인합니다.
2. 기존 stylesheet, CSS module, scoped style, token, naming pattern을 확인합니다.
3. reusable layout, variant, pseudo selector, media query, container query는 CSS/class에 둡니다.
4. inline style은 진짜 component-local, dynamic, state-derived 값으로 제한합니다.
5. 프로젝트가 이미 쓰는 CSS methodology가 있으면 새 방식을 도입하지 않습니다.
6. visible layout이나 responsive behavior가 바뀌면 rendered behavior를 검증합니다.

## Coordination

일반적인 UI polish에는 `style-quality-review`를 사용하고, shared component나 token이 styling을 맡아야 하면 `design-system-first`를 함께 사용합니다.
