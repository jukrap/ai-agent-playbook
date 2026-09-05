# Typography And Color Specification

## Typography

Typography는 mood board가 아니라 usable system으로 문서화합니다.

- Heading, body, code, data, display용 font family와 fallback stack.
- Display, title, heading, body, caption, label, data 같은 named role의 type scale.
- Font weight와 각 weight를 허용하는 상황.
- Role별 line height. Reading load가 낮을 때만 더 tight한 값을 씁니다.
- Letter spacing rule. Existing brand system이 요구하지 않는 한 negative tracking은 피합니다.
- Paragraph spacing, list spacing, content width.
- Raw viewport scaling이 아니라 role 기반 responsive behavior.
- Label, button, table, card의 locale와 long-word behavior.

## Color

Raw value보다 semantic color를 먼저 정의합니다.

- Brand: primary, accent, supporting, restricted-use color.
- Neutral: background, surface, raised surface, border, divider, text, muted text, disabled.
- Interaction: hover, active, selected, focus, visited, drag, pressed state.
- Status: success, warning, danger, info, pending, unknown, offline.
- Data: categorical series, sequential scale, diverging scale, highlight, missing value, low-confidence value.
- Media: overlay, scrim, image border, screenshot frame, placeholder.

## Accessibility Checks

- Token pair만 보지 말고 실제 component state에서 contrast를 확인합니다.
- 모든 surface color에서 focus visibility를 보존합니다.
- Status, validation, chart interpretation을 color-only meaning으로 만들지 않습니다.
- Project가 지원한다면 dark mode와 high-contrast mode를 first-class token mode로 둡니다.
- Color transition이 movement나 parallax와 결합되면 reduced-motion을 존중합니다.

## Implementation Notes

- One-off raw value보다 repository-native token과 CSS variable을 우선합니다.
- Reuse 가능성이 아직 없으면 단일 screen을 위해 global token을 추가하지 않습니다.
- 선택한 font나 theme mode를 사용할 수 없을 때 fallback behavior를 기록합니다.
- Generated palette exploration은 검토되고 이름이 붙을 때까지 durable memory에 넣지 않습니다.
