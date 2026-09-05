# Issue Breakdown Checks

Use this when turning broad work into reviewable issue shapes.

## Issue Types

- Bug: current behavior, expected behavior, reproduction, impact, suspected area, regression signal, verification.
- Feature: goal, user, workflow, scope, non-goals, acceptance criteria, dependencies, rollout.
- Chore: maintenance goal, affected surface, safety constraints, verification, rollback need.
- Docs: audience, source evidence, artifact type, freshness, owner, translation need, archive/update path.
- Research or spike: question, timebox, evidence to gather, decision output, non-implementation boundary.
- Migration: source/target, compatibility window, rollout order, backout path, reconciliation, owner.
- Follow-up: originating work, remaining risk, next action, due trigger, verification.

## Splitting Rules

- Split when different owners, reviewers, release gates, or verification methods are needed.
- Split when one issue mixes product decision, design decision, implementation, migration, and release communication.
- Do not split into file-by-file tasks unless each file is an independent deliverable.
- Keep a parent issue only when it owns acceptance criteria and tracks child completion criteria.

## Minimum Fields

- Title with outcome, not implementation trivia.
- Source evidence or reason this work exists.
- Scope and non-goals.
- Acceptance criteria.
- Verification plan.
- Risk and rollback or mitigation.
- Dependencies and blocked status.
- Owner or next decision maker.

## Noise Filter

- Remove raw chat fragments, private paths, internal URLs, credentials, branch names, PR numbers, and reference project names.
- Summarize generated reports as reviewed evidence, not as pasted output.
- Keep implementation notes in the plan or worklog when they are not needed by the issue reader.
