# Agent Orchestration Handoff

Inputs: orchestration goal, worker count or review passes, task boundaries, allowed paths, required reads, tool limits, context budget, write permission tier, evidence locator format, merge/review owner.

Outputs: worker contracts, evidence ledger, reconciliation summary, accepted findings, rejected or superseded claims, blockers, verification results, handoff note, promotion decision.

Skills: agent orchestration handoff, context engineering memory design, pre-action fact gate, evidence locator integrity, capability witness history, git worklog guardrails.

Tools: `workflow run-preview`, `operator search`, `operator preflight`, `index status`, `evidence locator-check`, `runtime schema-check`, `write-gate preview`, `run status`, `run record`, project-defined verification commands.

Stop conditions: worker scope is unclear, two write workers target the same files, required reads are missing, allowed write tier is unsafe, evidence is not reopenable, private data would enter shared output, generated summaries conflict with source evidence, reviewer cannot reconcile conflicting claims.

Verification: worker contracts recorded, allowed paths and stop conditions reviewed, evidence ledger entries have locators and scan ranges, conflicts reconciled, generated evidence kept out of durable memory until reviewed, final handoff states accepted findings, skipped checks, residual risk, and next action.
