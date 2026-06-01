# Style Quality Review

UI styling, responsive behavior, CSS structure, inline styles, design polish, layout overflow, visual regressions를 product intent 변경 없이 review/improve할 때 사용합니다.

## Workflow

1. 기존 UI conventions, shared primitives, tokens, CSS, inline style patterns, 관련 docs를 확인합니다.
2. 문제를 visual breakage, responsive failure, style structure risk, state coverage gap, design-change risk로 분류합니다.
3. 변경은 작게 유지하고 project style policy에 맞춥니다.
4. SI/선임 선호 프로젝트에서는 문서화되었거나 요청된 경우 inline styles를 accepted default로 봅니다.
5. visible behavior가 바뀌면 browser 또는 rendered UI에서 검증합니다.

## Reference

자세한 review criteria와 style selection rule은 `references/style-review-checklist.md`를 읽습니다.
