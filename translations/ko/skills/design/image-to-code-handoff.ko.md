# Image To Code Handoff

Visual artifact가 implementation을 이끌어야 하지만 coding work에 explicit token, component, state, responsive rule, verification evidence가 필요할 때 씁니다.

## Workflow

1. Source artifact, authority level, viewport, state, 허용되는 visual match 정도를 확인합니다.
2. Design intent, structure, token, component role, content hierarchy, interaction state를 추출합니다.
3. Image-only decision을 repository-native implementation contract로 변환합니다.
4. Hidden behavior, data contract, inaccessible state를 추측하지 말고 불확실한 detail을 표시합니다.
5. Acceptance criteria와 함께 frontend, design-system, accessibility, visual regression skill로 handoff합니다.

## Reference

Image와 mockup에서 implementable contract를 추출할 때 `references/image-to-code-contract.md`를 읽습니다.

Source가 Figma, design token, variable, variant, component-library guidance라면 `references/figma-handoff-contract.md`를 읽습니다.
