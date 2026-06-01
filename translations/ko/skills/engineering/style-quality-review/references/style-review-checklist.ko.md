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

## Style policy selection

- `design-system-first`: shared component, token, variant, slot, reusable UI primitive가 있습니다.
- `css-class-first`: stylesheet, CSS module, scoped CSS, semantic class name이 project convention입니다.
- `utility-class-first`: Tailwind-style utility나 atomic class composition이 project convention입니다.
- `inline-style-first`: component-local inline style object를 명시적으로 선호합니다.

명시적 policy가 없으면 component가 이미 쓰는 local pattern을 유지하고 새 styling system을 도입하지 않습니다.

## Verification

- 관련 있으면 repo-defined lint/build를 실행합니다.
- visible changes는 browser/device checks를 사용합니다.
- 실제 확인한 viewports 또는 scenarios만 언급합니다.
