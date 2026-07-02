# Harness OS v2 Documentation And Project Management Pack Plan

> **For implementers:** Continue after the data analytics depth pack. The harness now has stronger engineering, data, runtime, and MCP guidance, but documentation artifacts and project-management workflows still rely mostly on generic project docs and handoff skills.

**Goal:** Add capability-first guidance for requirements, PRDs, issue/task breakdown, stakeholder-ready documentation packages, changelogs/release notes, and durable handoff artifacts without turning raw chat transcripts or generated reports into trusted project memory.

**Reference inputs:** The refreshed local reference inventory shows recurring patterns around PRD generation, issue/triage conversion, teaching/briefing formats, handoff records, markdown knowledge bases, slide/report packaging, artifact manifests, and validation of generated docs. Adopt these as local skills, references, workflow recipes, and MCP prompts. Do not copy upstream prose, project names, personal paths, internal URLs, credentials, branch names, PR numbers, or large excerpts into public docs.

## Baseline

- Foundation/project-facing skills currently include `project-bootstrap`, `repo-onboarding`, `project-doc-system`, and `adr-spec-handoff`.
- `documentation-package` exists as a workflow recipe, but it does not yet distinguish PRD, issue plan, release note, stakeholder package, durable handoff, or knowledge package outputs.
- MCP prompts include ADR/spec handoff and workflow run review, but no dedicated documentation package or project planning prompt.
- Generated runtime evidence is already separated from durable memory; documentation work should preserve that boundary.

## Reference-Derived Rules To Adopt

- **Separate artifact type from source evidence:** PRD, issue plan, changelog, report, handoff, and knowledge package have different owners and verification criteria.
- **Keep generated notes provisional:** Raw transcripts, generated summaries, and runtime reports are evidence candidates until reviewed.
- **Make decisions traceable:** Requirements and issues should link back to reviewed goals, constraints, acceptance criteria, open questions, and verification evidence.
- **Avoid source noise:** Public docs should not inherit reference project names, personal paths, branch names, PR numbers, internal URLs, or raw excerpts.
- **Package for the reader:** Stakeholder docs, developer handoffs, release notes, and knowledge bases need different density, caveats, and next-action framing.
- **Validate docs like code:** Check translation coverage, public-doc hygiene, stale placeholders, local-only boundaries, and runnable links or commands where possible.

## Workstream A: Requirements And PRD Scope

### Task A1: Requirements PRD Scope Review Skill

**Candidate skill:** `project/requirements-prd-scope-review`

**References:**

- `prd-scope-checks.md`
- `acceptance-criteria-and-open-questions.md`

**Coverage:**

- Product requirements, feature scope, non-goals, personas, workflows, constraints, acceptance criteria, risks, and open questions.
- Turning vague requests into reviewable scope without inventing backend/API contracts.
- Keeping stakeholder language separate from implementation worklogs.

**Acceptance:**

- Skill describes when to produce a PRD/spec versus a plan/worklog/handoff.
- References require owners, success criteria, constraints, non-goals, dependencies, and open questions.
- Docs and translations list the new skill under project/foundation guidance when implemented.

## Workstream B: Issue And Task Breakdown

### Task B1: Issue Planning Triage Skill

**Candidate skill:** `project/issue-planning-triage`

**References:**

- `issue-breakdown-checks.md`
- `triage-priority-and-dependencies.md`

**Coverage:**

- Converting specs, bugs, reviews, worklogs, and user requests into scoped issues or task batches.
- Priority, dependency, risk, verification, ownership, labels, and blocked/unblocked status.
- Avoiding noisy issue dumps that duplicate plans without acceptance criteria.

**Acceptance:**

- Skill keeps issue planning separate from Git commit/PR guardrails.
- References distinguish bug, feature, chore, docs, research, spike, and follow-up issue shapes.
- Future workflow can route through `documentation-package` or a new planning recipe.

## Workstream C: Release Notes And Changelog

### Task C1: Release Notes Changelog Skill

**Candidate skill:** `project/release-notes-changelog`

**References:**

- `release-note-audience-checks.md`
- `changelog-risk-and-rollback.md`

**Coverage:**

- User-facing release notes, internal changelogs, migration notes, upgrade notes, rollback notes, known issues, and verification summaries.
- Separating user impact from implementation detail and commit history.

**Acceptance:**

- Skill does not duplicate `git-worklog-guardrails`; it focuses on reader-facing release artifacts.
- References require change grouping, risk/caveat handling, migration/rollback note, and verified test evidence.

## Workstream D: Documentation Artifact Package

### Task D1: Documentation Artifact Package Skill

**Candidate skill:** `project/documentation-artifact-package`

**References:**

- `artifact-package-manifest.md`
- `reader-handoff-and-maintenance.md`

**Coverage:**

- Packaging docs, runbooks, diagrams, reports, screenshots, decision records, source references, and evidence into a bounded documentation deliverable.
- Stakeholder package versus developer handoff versus internal knowledge base.
- Update cadence, ownership, archive path, and stale-content markers.

**Acceptance:**

- Skill keeps generated reports under runtime until reviewed and promoted.
- References require manifest, audience, source evidence, freshness, caveats, owner, and maintenance path.
- Works with `project-doc-system`, `adr-spec-handoff`, and `context-engineering-memory-design`.

## Workstream E: Workflow And MCP Follow-Up

### Task E1: Documentation Package Recipe Expansion

**Candidate recipe update:** `documentation-package`

**Acceptance:**

- Inputs include audience, artifact type, source evidence, owner, freshness, sensitive-data boundary, translation needs, and maintenance path.
- Skills include requirements PRD scope, issue planning, release notes/changelog, documentation artifact package, ADR/spec handoff, and project doc system when implemented.
- Verification includes public-doc hygiene, translation coverage, link/path checks, placeholder checks, source evidence review, and archive/update path.

### Task E2: Documentation Package Review Prompt

**Candidate prompt:** `documentation_package_review`

**Acceptance:**

- Prompt remains read-only.
- Prompt routes through `workflow_run_preview` with recipe `documentation-package`, `playbook_context`, `operator_search`, `canon_check`, `write_gate_preview`, and public-doc/translation validation guidance.
- Prompt asks whether the output should be a PRD/spec, issue plan, release note/changelog, handoff, knowledge package, or no durable doc.

## Workstream F: Docs, Tests, And Catalog

**Acceptance:**

- README skill list and category summaries include the new project/documentation skills.
- `docs/classification.md` and `docs/skill-taxonomy-v2.md` document the documentation/project-management map.
- Korean translations are updated in the same change.
- Skill count expectations are updated if skills are implemented.
- Catalog remains warning-free.

## Workstream G: Verification

Run after each implementation slice:

- `npm run check`
- `node --test --test-reporter=dot test/*.test.mjs`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `git diff --check`

## Suggested Order

1. Add and commit this plan.
2. Add `requirements-prd-scope-review` and `issue-planning-triage` first, because they improve upstream planning quality.
3. Add `release-notes-changelog` and `documentation-artifact-package` with references and translations.
4. Update README, classification, taxonomy docs, and skill-count tests.
5. Expand `documentation-package` recipe and smoke coverage.
6. Add `documentation_package_review` MCP prompt and prompt contract tests.
7. Re-run full verification and decide whether the next surface is project-management workflow automation, design/visual artifact generation, or managed-write tier implementation.

## Non-Goals

- No raw transcript storage in public docs.
- No automatic issue tracker, wiki, slide deck, or document service integration by default.
- No generated runtime report promotion into durable memory without review.
- No private reference source names, internal URLs, credentials, branch names, or PR numbers in reusable docs.
