# Design Token Handoff

## Inventory

- Source: Figma variable, design token, brand guide, existing CSS variable, theme config, component prop, documentation.
- Token class: color, typography, spacing, radius, shadow, border, z-index, motion, density, chart color, semantic status color.
- Consumer: shared component, feature screen, chart, markdown/content, email, print, mobile shell, embedded widget.
- Mode: light/dark, high contrast, locale, responsive density, reduced motion, brand/theme variant, runtime user preference.

## Mapping

- Intent를 이미 표현하는 token이 있으면 raw design value보다 semantic token을 우선합니다.
- Repository의 기존 token 또는 variant naming scheme과 일관되게 유지합니다.
- 여러 consumer가 필요하지 않은 one-off screen composition 때문에 global token을 추가하지 않습니다.
- Missing theme value, unsupported mode, old/new token 혼합 사용에 대한 fallback behavior를 기록합니다.
- Contrast, focus ring, status color, motion preference, readable type scale 같은 accessibility meaning을 보존합니다.

## Review

- Design source가 authoritative, draft, experiment-only, stale 중 무엇인지 확인합니다.
- 변경이 shared token, shared component variant, screen-local style, documentation note 중 어디에 속하는지 확인합니다.
- Token이 private product data, customer name, temporary campaign name을 encode하지 않도록 합니다.
- Generated export와 runtime build artifact는 검토 없이 durable memory에 넣지 않습니다.
