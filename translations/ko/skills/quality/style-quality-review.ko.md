# Style Quality Review

의도한 design을 보존하면서 style quality를 개선합니다.

## 진행 절차

1. 기존 UI conventions, shared primitives, tokens, CSS, inline style patterns, relevant docs를 확인합니다.
2. 이슈를 visual breakage, responsive failure, style structure risk, state coverage gap, design-change risk로 분류합니다.
3. 변경은 최소화하고 project style policy에 맞춥니다.
4. repository styling convention이 불분명하거나 충돌하거나 문서화할 가치가 있으면 `ui-style-policy`를 적용합니다.
5. visible behavior가 바뀌는 작업은 browser 또는 rendered UI로 검증합니다.

## 참고 자료

상세 review criteria와 style policy selection rules는 `references/style-review-checklist.md`를 읽습니다.
