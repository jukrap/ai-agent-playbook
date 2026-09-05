# Design Direction Brief

## 입력

- Product surface: landing page, dashboard, admin tool, workflow app, portfolio, ecommerce, data product, mobile view, kiosk, game, embedded widget.
- Audience and job: 누가 쓰는지, 얼마나 자주 쓰는지, 무엇을 판단하거나 해야 하는지, interface가 어떤 신뢰감을 줘야 하는지.
- Existing assets: brand guide, logo, screenshot, Figma frame, design system, component library, marketing copy, product screenshot, current production UI.
- Constraints: stack, component library, theming, accessibility bar, performance budget, device matrix, content length, localization, delivery deadline.
- Reference material: pattern과 decision evidence로만 사용합니다. Source prose, private path, upstream branding, exact visual을 public docs에 복사하지 않습니다.

## Product Fit

Style selection 전에 surface를 분류합니다.

- Operational product: scan density, stable navigation, restrained hierarchy, predictable control, 낮은 novelty를 우선합니다.
- Consumer product: 빠른 이해, 강한 identity, clear conversion path, responsive media를 우선합니다.
- Portfolio or brand page: first-viewport identity, proof of work, subject visibility, editorial pacing을 우선합니다.
- Data or analytics product: metric definition, chart legibility, comparison, drill path, caveat를 우선합니다.
- Interactive or media-heavy product: primary scene framing, performance, asset loading, fallback behavior, reduced-motion path를 우선합니다.

## Direction Decision

다음을 설명하는 한 문단을 작성합니다.

- intended visual language,
- product와 audience에 맞는 이유,
- existing product에서 안정적으로 유지해야 하는 것,
- 바꿀 수 있는 것,
- 재사용할 repository pattern,
- scope 밖에 둘 visible anti-pattern.

사용자가 variant를 명시적으로 요청하지 않았다면 style menu를 만들지 않습니다. Design direction은 implementation이 concrete token과 component state를 고를 수 있을 만큼 충분히 의견이 있어야 합니다.

## Output Contract

다음 section을 포함한 compact brief를 반환합니다.

- **Intent:** user job, business/project goal, primary surface.
- **Audience:** expertise level, frequency of use, trust expectation, device context.
- **Direction:** visual language, density, motion, brand posture.
- **Constraints:** stack, design-system boundary, accessibility, content, device, performance, asset limitation.
- **Keep:** navigation label, legal text, product terminology, brand mark, URL, data contract, component behavior 중 조용히 바꾸면 안 되는 것.
- **Change:** hierarchy, layout, spacing, state, copy tone, token mapping, media, interaction area 중 개선할 것.
- **Route:** 다음 skill 또는 workflow: brand identity system, design reference analysis, image-to-code handoff, frontend UI polish, frontend quality review, interactive experience delivery.

## Stop Conditions

- Product purpose가 불명확해 design이 순수 decoration이 되는 경우.
- 필수 brand/legal asset이 없는 경우.
- 요청된 visual direction이 accessibility, privacy, product clarity와 충돌하는 경우.
- 명시적 승인 없이 redesign이 navigation, legal copy, field name, checkout/auth flow, data meaning을 바꾸는 경우.
