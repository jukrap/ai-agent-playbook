# Harness OS v2 Cross-Domain Hardening Plan

## Goal

Continue the Harness OS v2 expansion after the design pack by strengthening broad engineering coverage: 3D/WebGL, security, backend async boundaries, architecture redesign judgment, reference adoption governance, and Korean translation quality.

## Findings

- The reference folder has broad signals across security, architecture, backend, frontend, design, MCP, delivery, and harness governance.
- Existing design coverage is now much stronger, but 3D/WebGL guidance was still too generic for Three.js production work.
- `security-review` was too short for agentic security, prompt injection, MCP/tool trust, memory poisoning, and project-local config risks.
- `backend-change-safety` covered server-side ownership well, but async delivery, webhook verification, retry, dead-letter, and idempotency checks needed a dedicated reference.
- `boundary-review` needed a deeper protocol for deciding when to preserve local conventions, introduce FSD/DDD/layered rules, split packages, or propose broad restructuring.
- Korean translations are valid structurally, but many files still read like English source with Korean particles.

## Current Slice

- Add Three.js/WebGL production checks to `interactive-media-3d-review`.
- Add general security review and agent/tool threat references to `security-review`.
- Add async boundary and idempotency checks to `backend-change-safety`.
- Add architecture boundary redesign protocol to `boundary-review`.
- Rewrite `docs/reference-adoption.md` so future reference use follows capability-centered extraction instead of source-name accumulation.
- Improve Korean translations for edited skill and doc surfaces.

## Next Slices

1. Security pack depth:
   - Expand `auth-access-control` with tenant/admin/role matrix evidence.
   - Expand `dependency-supply-chain-review` with install-script, binary, lockfile, and generated-code checks.
   - Add MCP/security workflow recipe for agentic threat review.
2. Backend and architecture depth:
   - Add service decomposition and integration adapter references.
   - Add architecture decision record workflow tying `boundary-review`, `domain-model-change`, and `monorepo-package-boundary`.
   - Add import/dependency rule examples for projects with existing lint tooling.
3. 3D and visual runtime:
   - Add visual evidence recipe for canvas/WebGL surfaces.
   - Add optional MCP prompt for interactive scene review using screenshot/pixel evidence.
   - Add docs connecting Playwright screenshot checks, pixel checks, and reduced-motion paths.
4. Translation cleanup:
   - Prioritize public docs: README, commands, classification, skill taxonomy, playbook layout, MCP permission model.
   - Then clean high-use skill translations by category.
   - Preserve technical terms only when Korean would be less precise.
5. Reference ledger:
   - Mark newly adopted cross-domain practices in the adoption ledger.
   - Keep `_reference` out of commits and public docs except generic capability summaries.

## Verification

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `.\scripts\sync-skills.ps1` after skill source validation
