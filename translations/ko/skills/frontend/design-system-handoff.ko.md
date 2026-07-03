# Design System Handoff

Design guidance를 repository-native UI primitive, token, variant, verification evidence로 변환하기 위한 primary frontend skill입니다.

## Workflow

1. Source design artifact, existing component system, token model, theme boundary, accessibility requirement, 구현할 screen/state를 확인합니다.
2. One-off styling을 추가하기 전에 design intent를 existing primitive, variant, slot, token, CSS convention에 매핑합니다.
3. Durable design-system change를 screen-local composition, experiment-only styling, copied reference visual과 분리합니다.
4. Supported theme, breakpoint, density/content variation, interaction state, accessibility constraint 전반에서 rendered state를 검증합니다.

## Reference

Token, theme, naming, ownership, fallback rule에는 `references/design-token-handoff.md`를 읽습니다.

Component variant, composition, migration, visual QA, adoption boundary에는 `references/component-system-adoption.md`를 읽습니다.
