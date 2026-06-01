# Style Review Checklist

## Preserve intent

- 요청 없이 redesign하지 않습니다.
- 운영 도구에 제품 이유 없이 장식적 layout을 추가하지 않습니다.
- visual hierarchy, density, workflow ergonomics를 일관되게 유지합니다.

## Check

- mobile/tablet/desktop width에서 overflow
- long text, labels, table cells, buttons, modals
- loading, empty, error, disabled, selected states
- CSS cascade와 specificity
- duplicated values와 inconsistent spacing
- shared primitive bypass
- card nesting 또는 불필요한 decoration

## Style selection

- Inline style: component-local dynamic values, SI/senior preference, state-derived layout.
- CSS/class: global layout, tokens, pseudo selectors, media/container queries, repeated variants.
- Shared UI: buttons, inputs, selects, modals, toasts, pagination, toolbars.

## Verification

- 관련 있으면 repo-defined lint/build를 실행합니다.
- visible changes는 browser/device checks를 사용합니다.
- 실제 확인한 viewports 또는 scenarios만 언급합니다.
