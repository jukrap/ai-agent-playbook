# Style Quality Review

UI styling, responsive behavior, CSS structure, inline styles, design polish, layout overflow, visual regressions를 product intent 변경 없이 review/improve할 때 사용합니다.

## Workflow

1. 기존 UI conventions, shared primitives, tokens, CSS, inline style patterns, 관련 docs를 확인합니다.
2. 문제를 visual breakage, responsive failure, style structure risk, state coverage gap, design-change risk로 분류합니다.
3. 변경은 작게 유지하고 project style policy에 맞춥니다.
4. repository convention이 명시적이면 맞는 style policy skill을 함께 적용합니다: `design-system-first`, `css-class-first`, `utility-class-first`, `inline-style-first`.
5. visible behavior가 바뀌면 browser 또는 rendered UI에서 검증합니다.

## Reference

자세한 review criteria와 style policy selection rule은 `references/style-review-checklist.md`를 읽습니다.
