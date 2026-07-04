# AI Agent Playbook v2 Interactive Experience Pack

**목표:** Harness를 다시 React-only 또는 frontend-only playbook으로 되돌리지 않으면서 3D, WebGL, canvas, interactive media, design-system handoff, rendered experience verification을 다루는 capability-first pack을 추가합니다.

**이유:** 현재 taxonomy는 UI polish, accessibility, state/data flow, visual regression을 다룹니다. 하지만 canvas/media는 verification detail로만 언급되어 Three.js/WebGL scene, chart/canvas tool, immersive product view, design-system token handoff를 위한 primary trigger가 약합니다. Local reference inventory에도 UI/UX, Figma, graph, presentation, app-shell 성격의 project가 있으므로 source를 복사하지 않고 concise guidance로 채택할 수 있어야 합니다.

**아키텍처:** 우선 `frontend` capability 아래에 둡니다. 주된 구현 표면이 rendered user experience이기 때문입니다. 다만 framework-neutral해야 합니다. 기존 renderer를 먼저 확인하고, 잘 정립된 graphics/rendering domain에는 검증된 library를 우선하며, 3D scene은 screenshot/pixel check로 측정 가능하게 만들고, 완전히 semantic하지 않은 experience에는 accessibility/fallback behavior를 요구합니다.

## 범위

- Three.js/WebGL/canvas/SVG/chart/media-heavy UI delivery/review를 위한 primary skill로 `frontend/interactive-media-3d-review`를 추가합니다.
- Figma/design-token/component-library adoption을 임의 visual system 복사 없이 처리하기 위한 `frontend/design-system-handoff`를 추가합니다.
- Nonblank rendering, asset loading, interaction evidence, performance budget, responsive framing, fallback state에 대한 concise reference를 추가합니다.
- `interactive-experience-delivery` workflow recipe를 추가합니다.
- Agent가 recipe, visual QA, write gate, existing frontend skill을 거치도록 MCP review prompt를 추가합니다.
- Taxonomy/classification/commands docs와 Korean translation을 갱신합니다.
- 새 skill, workflow, prompt가 discoverable함을 catalog/MCP test로 검증합니다.

## 비목표

- 이 repository에 rendering framework dependency를 추가하지 않습니다.
- Reference asset을 생성하거나 복사하지 않습니다.
- 더 많은 non-frontend 3D workflow가 생기기 전까지 별도 `3d` top-level category를 만들지 않습니다.
- Project가 이미 다른 suitable renderer를 쓰고 있으면 Three.js를 강제하지 않습니다.
- Project-write MCP tool을 노출하지 않습니다.

## 출력 계약

- Skill catalog가 trigger-focused description과 함께 새 frontend skill 2개를 표시합니다.
- Workflow catalog가 input, output, skill, tool, stop condition, verification을 포함한 `interactive-experience-delivery`를 표시합니다.
- MCP prompt list에 `interactive_experience_review`가 포함됩니다.
- Public docs는 personal path나 raw reference name 없이 새 pack을 언급합니다.
- Korean translation이 동기화됩니다.

## 구현 체크리스트

- [x] Plan과 Korean translation을 추가합니다.
- [x] Frontend skill 2개와 reference를 추가합니다.
- [x] Workflow recipe를 추가하고 workflow catalog를 갱신합니다.
- [x] MCP prompt와 docs를 추가합니다.
- [x] Catalog와 MCP prompt discovery test를 추가합니다.
- [x] Validation을 실행합니다.
- [x] 이 slice를 commit/push합니다.

## 검증

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --cached --check`
