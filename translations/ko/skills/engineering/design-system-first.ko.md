# Design System First

Repository에 custom styling보다 먼저 재사용해야 하는 shared UI component, design token, variant, design system이 있을 때 사용합니다.

## Workflow

1. 사용 가능한 shared UI component, token, variable, variant, 문서화된 design-system rule을 확인합니다.
2. button, input, modal, card, toast, pagination, tab, toolbar를 새로 만들기 전에 기존 primitive를 검색합니다.
3. custom CSS, utility override, inline style보다 component prop, variant, slot, token을 우선합니다.
4. design system에 필요한 state, density, layout, responsive behavior가 없을 때만 custom styling을 추가합니다.
5. 재사용성에 영향을 주는 예외는 좁게 유지하고 custom style이 필요한 이유를 문서화합니다.
6. shared component나 variant가 바뀌면 visible UI와 common state를 검증합니다.

## Coordination

시각 품질 review에는 `style-quality-review`를 사용합니다. Design-system 재사용 뒤에도 남는 custom styling layer에만 `css-class-first`, `utility-class-first`, `inline-style-first`를 사용합니다.
