# AI Agent Playbook v2 Interactive Experience Pack

**Goal:** Add a capability-first pack for 3D, WebGL, canvas, interactive media, design-system handoff, and rendered experience verification without turning the harness back into a React-only or frontend-only playbook.

**Why now:** The current taxonomy covers UI polish, accessibility, state/data flow, and visual regression. It only mentions canvas/media as a verification detail, so agents still lack a primary trigger for Three.js/WebGL scenes, chart/canvas tools, immersive product views, and design-system token handoff. The local reference inventory also contains UI/UX, Figma, graph, presentation, and app-shell oriented projects that should be adoptable as concise guidance rather than copied source.

**Architecture:** Keep this under the `frontend` capability for now, because the dominant implementation surface is rendered user experience. The pack should still be framework-neutral: inspect the existing renderer first, prefer proven graphics or rendering libraries for established domains, keep 3D scenes measurable with screenshots/pixel checks, and require accessibility/fallback behavior when the experience is not fully semantic.

## Scope

- Add `frontend/interactive-media-3d-review` as the primary skill for Three.js/WebGL/canvas/SVG/chart/media-heavy UI delivery and review.
- Add `frontend/design-system-handoff` for Figma/design-token/component-library adoption without copying arbitrary visual systems.
- Add concise references for nonblank rendering, asset loading, interaction evidence, performance budgets, responsive framing, and fallback states.
- Add a bundled workflow recipe for `interactive-experience-delivery`.
- Add an MCP review prompt that routes agents through the recipe, visual QA, write gate, and existing frontend skills.
- Update taxonomy/classification/commands docs and Korean translations.
- Add catalog/MCP tests proving the new skills, workflow, and prompt are discoverable.

## Non-Goals

- Do not add a rendering framework dependency to this repository.
- Do not generate or copy reference assets.
- Do not create a separate `3d` top-level category until more non-frontend 3D workflows exist.
- Do not require Three.js when the project already uses another suitable renderer.
- Do not expose project-write MCP tools.

## Output Contract

- Skill catalog lists both new frontend skills with trigger-focused descriptions.
- Workflow catalog lists `interactive-experience-delivery` with inputs, outputs, skills, tools, stop conditions, and verification.
- MCP prompt list includes `interactive_experience_review`.
- Public docs mention the new pack without personal paths or raw reference names.
- Korean translations stay in sync.

## Implementation Checklist

- [x] Add plan and Korean translation.
- [x] Add two frontend skills and their references.
- [x] Add workflow recipe and update workflow catalog.
- [x] Add MCP prompt and docs.
- [x] Add tests for catalog and MCP prompt discovery.
- [x] Run validation.
- [x] Commit and push this slice.

## Verification

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --cached --check`
