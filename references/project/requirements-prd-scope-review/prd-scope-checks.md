# PRD Scope Checks

Use this checklist before treating a request as implementation-ready.

## Artifact Fit

- PRD: product outcome, users, workflows, constraints, success metrics, rollout, risks, and open decisions.
- Lightweight spec: known behavior, interfaces, states, constraints, and verification for a bounded change.
- Scope brief: what is in, what is out, who owns each decision, and what evidence is missing.
- Open-question list: unresolved product, data, API, security, compliance, operations, or ownership questions.

## Required Sections

- Problem or goal: the user-visible or business reason for the work.
- Audience or persona: who benefits, who operates it, and who reviews it.
- Current behavior: observed source, screen, workflow, data, or policy evidence.
- Proposed behavior: externally visible behavior, states, and constraints.
- Non-goals: explicit exclusions that prevent scope creep.
- Dependencies: systems, teams, data sources, approvals, release gates, migrations, or design assets.
- Risks: compatibility, security, privacy, data integrity, operational, migration, UX, and support risks.
- Verification: how the change will be checked and what remains manual or unverified.
- Owner and status: draft, reviewed, approved, deferred, superseded, or archived.

## Evidence Rules

- Treat raw transcripts, generated summaries, and runtime reports as provisional evidence until reviewed.
- Link to reviewed source evidence, not noisy reference names or personal paths.
- Do not convert guesses about fields, endpoints, roles, tables, events, or environments into requirements.
- If the source is unclear, write the uncertainty as an open question with an owner.

## Stop Conditions

- The requested outcome conflicts with current product or policy docs.
- Required user/data/API/security ownership is unknown.
- Acceptance criteria depend on implementation details that have not been confirmed.
- The artifact would expose private paths, credentials, internal URLs, branch names, PR numbers, or raw reference excerpts.
