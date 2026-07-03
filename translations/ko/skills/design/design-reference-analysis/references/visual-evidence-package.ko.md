# Visual Evidence Package

## Evidence Types

- Current product의 baseline screenshot.
- Licensing과 privacy가 허용하는 reference screenshot 또는 generated mockup.
- Implementation의 before/after screenshot.
- Viewport matrix: mobile, tablet, desktop, wide desktop, 관련 embedded size.
- State matrix: default, hover, focus, selected, disabled, loading, empty, error, success, overflow, long content.
- Accessibility note: contrast, keyboard focus order, reduced motion, text scaling, 관련 screen-reader semantic.
- Interaction note: pointer, keyboard, touch, scroll, drag, animation, media loading behavior.

## Packaging Rules

- Generated evidence는 검토 전까지 `.ai-playbook/runtime/` 또는 다른 project-local runtime area에 저장합니다.
- Reviewed decision만 `memory/`, design docs, source comment로 승격합니다.
- Public docs에는 portable locator와 relative path를 사용합니다.
- Reusable skill에는 큰 embedded image를 넣지 않습니다. 대신 evidence를 link하거나 요약합니다.
- Credential, customer data, internal URL, personal data가 들어간 raw screenshot은 public documentation에 넣지 않습니다.

## Review Questions

- Evidence가 주장하는 exact state를 보여주는가.
- Viewport와 content length가 현실적인가.
- Long label, translated text, empty data, error state에서도 design이 작동하는가.
- Primary interaction과 keyboard path를 evidence에 포함했는가.
- Reference visual과 product truth가 명확히 분리되어 있는가.

## Acceptance Criteria

Visual adoption claim은 다음을 만족할 때 ready입니다.

- source boundary가 명확합니다.
- local mapping이 명시적입니다.
- before/after 또는 target evidence가 있습니다.
- 해결되지 않은 accessibility와 content-fit risk를 명명했습니다.
- verification command 또는 manual check가 기록되었습니다.
