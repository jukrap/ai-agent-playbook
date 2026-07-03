# Reference Analysis Protocol

## Source Boundary

다음을 기록합니다.

- reference가 무엇인지,
- public/private/generated/client-provided/local-only 중 무엇인지,
- 어떤 screen, state, viewport를 검토했는지,
- reference가 무엇에 영향을 줄 수 있는지,
- 무엇을 복사하면 안 되는지.

Proprietary copy, source code, brand mark, distinctive illustration, exact layout composition, private path, internal URL, asset file은 public docs에 복사하지 않습니다.

## Analysis Sequence

1. **Purpose:** Reference surface가 사용자가 어떤 일을 완료하는 데 도움을 주는가.
2. **Hierarchy:** 첫 번째, 두 번째, 세 번째로 무엇이 보이는가. 어떤 정보가 의도적으로 조용한가.
3. **Layout:** Grid, alignment, density, scroll rhythm, empty space, grouping, navigation structure.
4. **Typography:** Role, scale, weight, line height, truncation, label treatment, reading load.
5. **Color:** Semantic role, contrast, surface depth, data color, status color, focus visibility.
6. **Components:** Button, input, menu, card, table, chart, media, modal, toolbar, repeated pattern.
7. **Interaction:** Hover, pressed, selected, loading, error, empty, disabled, drag, keyboard, touch, reduced-motion behavior.
8. **Content:** Wording density, terminology, proof, label, microcopy, product evidence.
9. **Risks:** Accessibility gap, performance-heavy media, misleading hierarchy, content overflow, category mismatch.
10. **Adoption:** Reusable principle, local adaptation, verification evidence, non-goal.

## Adoption Rules

- Local product problem을 해결할 때만 principle을 채택합니다.
- Exact value를 복사하지 말고 visual idea를 local token, component, state로 번역합니다.
- 약한 유사점이 많은 collage보다 강한 reference insight 한두 개를 우선합니다.
- Attribution이 필요하고 안전한 경우가 아니라면 reference name과 upstream detail을 public guidance에 넣지 않습니다.
- Reference가 local product type과 충돌하면 style을 강제하지 말고 충돌을 설명합니다.

## Output Contract

- **Reusable principles:** local에 적용되는 concise finding.
- **Do not copy:** 피해야 할 source-specific element.
- **Local mapping:** 영향받는 token, component, layout, state, workflow.
- **Evidence:** 가능한 경우 screenshot, viewport, source locator shape, runtime report path.
- **Verification:** shipping 전 필요한 visual, accessibility, responsive, interaction check.
