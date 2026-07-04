# AI Agent Playbook v2 Eval Witness Knowledge Pack Plan

> **For implementers:** Continue after the documentation/project-management pack. This plan focuses on the harness reliability layer: evals, capability witnesses, fact gates, and source-aware knowledge retrieval.

**Goal:** Add a practical evidence layer for agent work: define task evals before risky automation, keep capability and performance witnesses over time, force concrete facts before broad edits, and model external/project knowledge sources with explicit registry and locator contracts.

**Reference inputs:** The refreshed local reference inventory repeatedly shows four useful patterns: eval-driven agent workflows, append-only capability witness history, pre-action fact forcing, and unified search/read surfaces over many source types. Adopt the patterns as local skills, references, workflow recipes, CLI/MCP read surfaces, and validation rules. Do not copy upstream prose, project names, personal paths, internal URLs, credentials, branch names, PR numbers, or large excerpts into public docs.

## Baseline

- AI Agent Playbook already has runtime indexes, `write-gate preview`, `canon check`, workflow previews, project documentation packaging, and read-only MCP prompts.
- Existing skills cover test verification and knowledge retrieval review, but there is no first-class eval artifact model for agent/harness changes.
- Runtime reports can be generated, but capability history is not yet append-only or baseline-aware.
- Write-gate preview checks planned writes, but there is no explicit pre-action fact gate that asks for importers, public API, schema, and user intent before risky edits.
- Knowledge references exist, but project-local source registries do not yet model connector status, locator shape, search range, or generated-versus-promoted evidence consistently.

## Reference-Derived Rules To Adopt

- **No claim without evidence:** Structural counts, absence claims, source coverage, and capability status must name the scan range or source range.
- **Define eval before changing the harness:** Capability and regression evals should exist before adding or changing agent-facing workflows, prompts, MCP tools, or write tiers.
- **Prefer deterministic graders:** Use code/schema/rule graders before model or human graders; reserve human review for ambiguous, security-sensitive, or product-judgment outputs.
- **Track reliability over time:** Capability witnesses should record commit, timestamp, OS/runtime, duration, status, baseline, and deltas in append-only history.
- **Force facts before risky action:** Broad edits, new owner files, destructive commands, migrations, permissions, and source rewrites should require concrete context before the action proceeds.
- **Search, locate, browse:** Retrieval should first find candidates, then reopen exact locators or ranges, then promote only reviewed facts.
- **Keep provisional evidence separate:** Runtime reports, generated summaries, raw transcripts, and index hits stay provisional until reviewed and promoted.
- **Use stable tool envelopes:** Agent-facing tools should return status, summary, next actions, artifacts, warnings, conflicts, and recovery hints.

## Workstream A: Eval Harness Artifacts

### Task A1: Eval Harness Design Skill

**Candidate skill:** `delivery/eval-harness-design`

**References:**

- `eval-artifact-contract.md`
- `grader-and-metric-rubric.md`

**Coverage:**

- Capability evals, regression evals, code/rule/model/human graders, pass@k/pass^k, cost/latency caveats, and release-critical thresholds.
- Eval definitions for prompt changes, workflow recipes, MCP prompts, write tiers, and skill behavior.
- Separating eval definitions, run history, and release summaries under `.ai-playbook/runtime/` or workflow run records until promoted.

**Acceptance:**

- Skill explains when evals are required before implementation.
- References define artifact schema, grader choice, metric thresholds, and anti-overfitting checks.
- The skill complements `test-verification-strategy` rather than duplicating ordinary unit-test guidance.

### Task A2: Eval Workflow Recipe

**Candidate recipe:** `eval-driven-change`

**Acceptance:**

- Inputs include target behavior, risk class, baseline, grader type, success criteria, retry budget, cost/latency budget, and promotion path.
- Outputs include eval definition, run report, pass/fail summary, residual risk, and follow-up issues.
- Verification requires at least one deterministic grader where feasible.

## Workstream B: Capability Witness History

### Task B1: Capability Witness Skill

**Candidate skill:** `ai-harness/capability-witness-history`

**References:**

- `capability-ledger-schema.md`
- `regression-baseline-policy.md`

**Coverage:**

- Append-only capability history for install, update, MCP startup, catalog check, index build, workflow preview, and selected high-value runtime operations.
- Baseline comparison by OS/runtime where stable measurements exist.
- Witness entries that distinguish pass, fail, skipped, degraded, unknown, and not-applicable states.

**Acceptance:**

- Skill requires timestamp, version/commit, environment, capability id, command, status, duration, artifacts, and caveats.
- References define when a slow or skipped result is signal versus noise.
- Runtime witness reports do not become durable memory without canon promotion.

### Task B2: Witness CLI Read Surface

**Candidate CLI surface:** `witness status`, `witness check`, `witness history`

**Acceptance:**

- Default commands are read-only.
- History lives under `.ai-playbook/runtime/reports/witness/` or `.ai-playbook/runtime/indexes/`.
- MCP exposes only read tools until an explicit managed-write tier exists.

## Workstream C: Pre-Action Fact Gate

### Task C1: Pre-Action Fact Gate Skill

**Candidate skill:** `ai-harness/pre-action-fact-gate`

**References:**

- `fact-gate-checks.md`
- `destructive-action-review.md`

**Coverage:**

- Before editing existing files: importers/callers, public functions/classes, data schemas, user instruction, nearby patterns, and blast radius.
- Before new files: intended caller, existing owner search, naming/domain cluster, lifecycle owner, and deletion/rollback path.
- Before destructive commands: target list, rollback plan, explicit user instruction, and dry-run evidence.

**Acceptance:**

- Skill remains a decision aid, not a default blocker.
- References keep questions concrete and bounded so agents gather facts instead of self-evaluating.
- Works with existing `write-gate preview` and future advisory/post-check commands.

### Task C2: Fact Gate Prompt

**Candidate MCP prompt:** `pre_action_fact_gate_review`

**Acceptance:**

- Prompt is read-only.
- It routes through `write_gate_preview`, `operator_search`, `operator_map`, `canon_check`, and `diagnostics_check` when available.
- It returns required facts, missing facts, and stop conditions without applying changes.

## Workstream D: Source-Aware Knowledge Registry

### Task D1: Knowledge Source Registry Skill

**Candidate skill:** `data/knowledge-source-registry`

**References:**

- `source-registry-contract.md`
- `locator-and-evidence-envelope.md`

**Coverage:**

- Project-local source registry for files, docs, issue trackers, chats, databases, object stores, web crawls, and generated runtime indexes.
- Connector/source status: available, building, partial, unavailable, failed, stale, unknown.
- Locator contract: path/range, structured primary key, row id, thread id, object id, or report artifact path.

**Acceptance:**

- Skill keeps external connector setup out of default install.
- References define search range, freshness, locator, evidence type, and privacy boundary.
- Generated search hits remain provisional until reviewed and promoted.

### Task D2: Knowledge Source Recipe

**Candidate recipe:** `knowledge-source-onboarding`

**Acceptance:**

- Inputs include source type, owner, credentials boundary, update cadence, expected locator shape, search mode, privacy tier, and promotion policy.
- Outputs include registry entry, browse/search instructions, caveats, and verification command.
- Stop conditions include missing owner, unclear credentials boundary, unbounded source, or private data risk.

## Workstream E: MCP And Runtime Integration

### Task E1: Read-Only Prompts

**Candidate prompts:**

- `eval_harness_review`
- `capability_witness_review`
- `pre_action_fact_gate_review`
- `knowledge_source_review`

**Acceptance:**

- Prompts do not grant write access.
- Prompt tests prove each prompt references the intended read tools and stop conditions.
- Docs list the prompts in English and Korean command references.

### Task E2: Runtime Schemas

**Candidate schemas:**

- `runtime.eval-definition`
- `runtime.eval-run-report`
- `runtime.capability-witness`
- `runtime.source-registry`
- `runtime.evidence-envelope`

**Acceptance:**

- Schemas are compact, versioned, and local-first.
- Snapshot/runtime outputs are not promoted to `memory/` automatically.
- Validators reject personal paths, credentials, raw transcripts, and oversized source excerpts in public docs.

## Workstream F: Docs, Tests, And Catalog

**Acceptance:**

- README and taxonomy docs list the new skills only after implementation.
- `docs/harness-os.md`, `docs/playbook-layout-v2.md`, and `docs/mcp-permission-model.md` describe eval/witness/source registry boundaries when runtime surfaces are implemented.
- Korean translations are updated in the same change.
- Skill counts and MCP prompt tests are updated when new artifacts land.

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
2. Implement `eval-harness-design` with references and translation.
3. Implement `capability-witness-history` with references and translation.
4. Implement `pre-action-fact-gate` with references and translation.
5. Implement `knowledge-source-registry` with references and translation.
6. Update taxonomy, README, catalog tests, and skill count expectations.
7. Add `eval-driven-change` and `knowledge-source-onboarding` recipes.
8. Add read-only MCP prompts and prompt contract tests.
9. Add runtime schemas and read-only CLI previews.
10. Run full verification and commit each logical slice.

## Non-Goals

- No always-on external connector ingestion.
- No default embeddings or network index provider.
- No raw transcript promotion into trusted memory.
- No project source rewrite through MCP in this pack.
- No blocking hook installed by default.
- No public documentation copied from reference sources.
