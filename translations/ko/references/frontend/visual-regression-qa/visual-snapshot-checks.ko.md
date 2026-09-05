# Visual Snapshot Checks

## Inventory

- Surface: page, modal, component, menu, table, chart, canvas, media element, email, PDF preview, print view.
- State: default, hover/focus/active, loading, empty, error, disabled, selected, expanded, validation failure, permission-limited view.
- Baseline: previous screenshot, design reference, accepted snapshot, production capture, documented expected layout.
- Environment: browser, viewport, device scale factor, theme, locale, data seed, network state, animation setting, font availability.

## Review

- Snapshot이 isolated happy path만이 아니라 user workflow를 대표하는지 확인합니다.
- Screenshot 비교에서는 stable data를 사용하고 animation을 끄거나 통제합니다.
- Visual difference가 intentional design change, layout regression, rendering noise, data difference 중 무엇인지 확인합니다.
- Chart/canvas/media는 nonblank rendering, correct bounds, label, interaction affordance를 확인합니다.
- Project가 artifact를 저장한다면 surface, viewport, state, date 또는 run ID 기준으로 이름을 유지합니다.

## Verification

- 변경된 responsive surface의 desktop/mobile viewport screenshot.
- Control이나 interaction style이 바뀌었으면 focus/hover/active state.
- Data-driven UI의 loading, empty, error, long-content state.
- Baseline이 있으면 visual diff 또는 manual side-by-side comparison.
- Blank media, canvas, font, image가 rendering에 영향을 줄 수 있으면 browser console/network check.

## Stop Conditions

- 논쟁 중인 visual change에 stable baseline 또는 acceptance criteria가 없습니다.
- Dynamic data, animation, environment drift 때문에 diff를 읽을 수 없습니다.
- Canvas, image, chart, media element가 blank로 렌더링되거나 bounds 밖에 그려집니다.
- Supported viewport에서 text 또는 layout regression이 보이며 intentional change로 설명할 수 없습니다.
