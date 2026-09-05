# Image To Code Contract

## Source Classification

Implementation 전에 image를 분류합니다.

- **Authoritative mockup:** Design owner가 알려져 있고 close match가 기대됩니다.
- **Generated direction:** Mood와 composition에 유용하지만 exact source of truth는 아닙니다.
- **Reference screenshot:** Principle에는 유용하지만 exact design copy 대상은 아닙니다.
- **Current product screenshot:** Redesign 또는 regression work의 baseline evidence입니다.
- **Partial crop:** 추가 assumption이 필요하며 hidden state를 정의하지 않습니다.

## Extraction

다음을 추출합니다.

- page 또는 component purpose,
- layout grid와 major region,
- content hierarchy와 reading order,
- component inventory,
- typography role,
- color role,
- spacing rhythm,
- image/media treatment,
- 보이거나 암시된 interaction state,
- 추론하거나 별도 지정해야 하는 responsive behavior,
- accessibility risk.

## Contract Shape

Implementation-ready contract를 작성합니다.

- **Target surface:** route, component, page, modal, email, slide, embedded widget.
- **Visual match level:** strict, close, direction-only, exploratory.
- **Tokens:** semantic color, typography role, spacing, radius, shadow, motion, density.
- **Components:** 재사용할 existing primitive, 추가할 variant, local로 유지할 one-off composition.
- **States:** loading, empty, error, success, disabled, focus, hover, selected, overflow, long content.
- **Responsive rules:** breakpoint behavior, stacking, fixed aspect ratio, min/max width, scroll behavior.
- **Assets:** source, license, export format, fallback, alt text.
- **Verification:** screenshot matrix, accessibility check, interaction check, content-fit check.

## Uncertainty Handling

- Static image에서 hidden API data, auth behavior, business rule, navigation path를 만들지 않습니다.
- Exact matching이 중요하면 missing source detail을 요청하거나 문서화합니다.
- Image가 component state를 말하지 않으면 existing repository convention을 사용합니다.
- Generated-image artifact는 검토 전까지 draft evidence로 둡니다.
