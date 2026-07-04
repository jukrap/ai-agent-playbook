# Brand System Checklist

## Identity Inventory

- Brand name, wordmark, symbol, existing logo variant, favicon/app icon, lockup constraint.
- Product category, audience, trust posture, competitive visual norm.
- Required application: web app, landing page, admin UI, mobile shell, social graphic, presentation, document, email, chart, ad, print.
- Existing design token, theme mode, component library, imagery, illustration, icon set.
- Legal, licensing, trademark, attribution, client-specific restriction.

## System Components

현재 project가 사용하고 유지할 수 있는 것만 정의합니다.

- Logo usage: clear space, minimum size, background treatment, monochrome variant, forbidden modification.
- Typography: typeface, fallback stack, scale, weight, line height, letter spacing, max line length, responsive behavior.
- Color: primary, neutral, semantic, status, chart, focus, border, surface, overlay, disabled state.
- Shape and spacing: radius, border, shadow, density, layout rhythm, component spacing.
- Iconography: stroke weight, filled versus outline, sizing, alignment, semantic meaning.
- Imagery: product screenshot, people, object, generated image, photo treatment, crop rule, alt-text expectation.
- Voice: terminology, tone, button language, error tone, empty state, support message.

## Application Matrix

각 application마다 다음을 기록합니다.

- required asset,
- size 또는 aspect ratio,
- allowed token subset,
- dark/light behavior,
- accessibility constraint,
- export 또는 implementation owner,
- verification evidence.

Application row 예: app header, primary button, chart palette, document cover, slide title, social avatar, app icon, product screenshot frame, email banner.

## Review Gates

- System을 existing token으로 구현하거나 clear token migration으로 옮길 수 있습니다.
- Identity color는 실제 component state에서 contrast requirement를 만족합니다.
- Logo와 icon asset에는 source, license, export rule이 있습니다.
- Typography는 localization, long label, dense table, mobile size를 지원합니다.
- 사용자가 product를 살펴봐야 할 때 decorative asset이 product evidence를 대체하지 않습니다.
- Generated/reference visual은 durable source asset이 아니라 evidence 또는 draft로 표시합니다.
