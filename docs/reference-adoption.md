# Reference Adoption

External references are useful, but everyday agent prompts should not carry noisy source lists. Adopt references by converting them into local capabilities, recipes, concise references, tests, and MCP surfaces.

The goal is not to preserve a reference project's identity. The goal is to extract durable operating practice that improves this harness without importing personal paths, stale source names, duplicated prose, or broad instructions that dilute agent behavior.

## Adoption Steps

1. Inventory the source material with the read-only reference commands.
2. Classify each item by capability category and adoption status.
3. Inspect representative files directly before adopting anything.
4. Extract durable practices, constraints, decision gates, failure modes, and verification checks.
5. Place short trigger guidance in `SKILL.md`.
6. Place reusable procedural detail in skill-local `references/`.
7. Add workflow recipes when the source describes a repeatable process.
8. Add MCP resources, prompts, or tools only when the behavior needs runtime discovery or execution.
9. Add tests or validators when the adopted rule is structural.
10. Record major design decisions in docs or worklogs.

## Adoption Tiers

| Tier | Use for | Output |
|---|---|---|
| Observe | Broad scans and capability matrix review. | Plan notes, adoption ledger, no skill changes. |
| Distill | A reference has useful procedure but no runtime need. | Skill reference, workflow recipe, doc update. |
| Operationalize | A reference describes repeatable checks or generated evidence. | CLI/MCP preview, validator, runtime artifact schema, tests. |
| Govern | A reference changes how the harness grows. | Taxonomy rule, lint, permission model, maintenance doc, migration note. |

## What To Extract

- Trigger conditions: when an agent should reach for a capability.
- Preconditions: required repo signals, tools, permissions, credentials, or user approval.
- Stop conditions: when to pause, ask, escalate, or refuse.
- Evidence contract: screenshots, command output, locators, traces, reports, ledgers, or verification matrix.
- Boundary rule: where content belongs in skills, references, templates, runtime, memory, docs, or MCP.
- Failure modes: blank canvas, stale memory, hidden prompt injection, duplicate delivery, unsafe config, dependency drift, or doc/code mismatch.

## What Not To Extract

- Source project branding unless the final content is explicitly about that project.
- Long prose that belongs to a human article rather than a reusable operating rule.
- Provider-specific setup unless the skill is specifically about that provider.
- Commands that write outside the target workspace without an explicit permission model.
- Personal absolute paths, internal domains, credentials, branch names, issue numbers, PR numbers, and old operational status.

## Keep Out

- Personal absolute paths.
- Company names and internal URLs.
- Credentials, tokens, branch names, issue numbers, and PR numbers.
- Raw copied references that are too long to be useful at trigger time.

## Ledger Discipline

- Use the reference ledger for source status, not for everyday prompt context.
- Mark a reference as adopted only after its durable content appears in local skills, docs, workflows, tests, or MCP surfaces.
- Mark a reference as skipped when it is too narrow, noisy, stale, license-unclear, or already covered.
- Do not leave source-specific notes in public skill bodies unless they are needed for attribution or license compliance.
- Keep generated runtime reports separate from `memory/` until a reviewed promotion step happens.

## Review Checklist

- Does this addition make an agent choose the right behavior faster?
- Is the content capability-centered rather than stack-name or source-name centered?
- Is the reusable detail in `references/` instead of bloating `SKILL.md`?
- Are Korean translations updated with natural Korean, not half-English placeholders?
- Are new MCP write behaviors opt-in, preview-first, path-validated, and audited?
- Did validation run after source and translation edits?
