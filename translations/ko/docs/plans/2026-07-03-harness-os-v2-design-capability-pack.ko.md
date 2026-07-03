# Harness OS v2 Design Capability Pack

**목표:** Local reference source material을 업로드하거나 복사하지 않으면서 design direction, brand identity, visual reference analysis, image-to-code handoff, Figma handoff, visual evidence contract를 담는 capability-first design pack을 추가합니다.

**이유:** 기존 frontend pack은 UI polish, state/data behavior, accessibility, visual regression, interactive media, design-system implementation handoff를 다룹니다. Local reference review에서는 brief inference, style dial, brand system, reference board, Figma/image handoff, visual evidence에 대한 더 강한 design workflow가 보입니다. 이 관심사는 frontend implementation skill 안에 묻어두기보다 별도 capability로 분리하는 편이 맞습니다.

**아키텍처:** 별도 `design` capability category를 만듭니다. Design skill은 visual contract를 결정하고 문서화하는 데 집중합니다. `frontend`는 implementation, browser behavior, state/data, accessibility, rendered verification을 담당합니다. Reference material은 local-only evidence로 남기며, public docs에는 generalized pattern만 넣고 raw reference prose, personal path, private URL, secret, branch name, PR number, source branding noise를 넣지 않습니다.

## 범위

- Product-fit, visual language, style dial, constraint, design brief를 위한 `design/design-brief-direction`을 추가합니다.
- Typography, color, logo usage, identity application, brand review gate를 위한 `design/brand-identity-system`을 추가합니다.
- Screenshot, competitor/reference app, design board, source boundary, visual evidence package를 위한 `design/design-reference-analysis`를 추가합니다.
- Generated image, mockup, screenshot, reference board, Figma frame, UI contract, verification criteria를 위한 `design/image-to-code-handoff`를 추가합니다.
- `design-reference-handoff` workflow recipe를 추가합니다.
- `design_reference_handoff_review` MCP prompt를 추가합니다.
- Reference adoption이 `design`을 독립 capability로 드러내게 합니다.
- README, classification, taxonomy, command docs, translation, test를 갱신합니다.

## 비목표

- Local reference folder를 repository에 복사하지 않습니다.
- Design-generation runtime dependency를 추가하지 않습니다.
- Frontend implementation skill이 brand 또는 reference-source authority decision까지 담당하게 하지 않습니다.
- Generated image, screenshot, Figma frame을 검토 전 durable project truth로 취급하지 않습니다.
- Project-write MCP tool을 노출하지 않습니다.

## 출력 계약

- Skill catalog가 새 design category와 design skill 4개를 표시합니다.
- Workflow catalog가 `design-reference-handoff`를 표시합니다.
- MCP prompt list에 `design_reference_handoff_review`가 포함됩니다.
- `reference capability-matrix --capability design`과 `reference adoption-plan --capability design`이 design-specific surface와 guidance를 반환합니다.
- Public docs와 Korean translation이 동기화됩니다.

## 구현 체크리스트

- [x] Plan과 Korean translation을 추가합니다.
- [x] Design skill과 reference를 추가합니다.
- [x] Workflow recipe와 taxonomy category를 추가합니다.
- [x] Reference adoption design capability routing을 추가합니다.
- [x] MCP design prompt와 docs를 추가합니다.
- [x] Catalog, workflow, MCP, reference adoption test를 추가합니다.
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
