# Eval Artifact Contract

Eval artifacts turn harness claims into repeatable evidence. Keep definitions, run reports, and promotion notes separate so generated evidence does not become durable memory by accident.

## Eval Definition

An eval definition should include:

- `schemaVersion`: artifact schema version.
- `kind`: `runtime.eval-definition`.
- `id`: stable lowercase hyphenated eval id.
- `target`: skill, prompt, workflow, MCP surface, CLI command, or agent behavior being evaluated.
- `behavior`: the expected behavior in observable terms.
- `riskClass`: `low`, `medium`, `high`, or `release-gate`.
- `baseline`: previous commit, fixture, reference transcript, command output, or accepted behavior.
- `fixtures`: input prompts, repository fixtures, files, mocked tool results, or seed data.
- `graders`: deterministic graders first, then model or human graders only when judgment is required.
- `successCriteria`: pass/fail thresholds, required evidence, allowed caveats, and retry policy.
- `budgets`: max runtime, max tokens, max external calls, and max cost when relevant.
- `storage`: runtime-only path and optional reviewed promotion target.

## Eval Run Report

An eval run report should include:

- `schemaVersion`: artifact schema version.
- `kind`: `runtime.eval-run-report`.
- `evalId`: matching eval definition id.
- `targetVersion`: commit, package version, skill version, prompt hash, or command version.
- `environment`: OS, runtime, package manager, model/tool version, and notable feature flags.
- `attempts`: pass@k or repeat count, including retry rationale.
- `results`: grader outputs, pass/fail status, skipped cases, degraded cases, and unknown cases.
- `artifacts`: portable paths to logs, screenshots, reports, or generated files.
- `caveats`: missing fixtures, non-comparable baselines, flaky signals, or manual judgment.
- `decision`: accepted, rejected, needs follow-up, or advisory-only.

## Storage Boundaries

- Store generated eval definitions and reports under `.ai-agent-playbook/runtime/reports/evals/` or `.ai-agent-playbook/runtime/indexes/`.
- Keep human-reviewed eval policy, accepted gates, or durable lessons under `.ai-agent-playbook/memory/decisions/` only after review.
- Do not promote raw transcripts, long model outputs, or temporary traces into `memory/`.
- Use portable project-relative paths in artifacts; do not store personal absolute paths, credentials, branch names, PR numbers, or internal URLs in public docs.
- Keep large logs and screenshots as runtime artifacts with short summaries and hashes.

## Stop Conditions

Stop and redesign the eval when:

- The target behavior is not observable.
- The eval cannot distinguish a pass from a plausible but wrong answer.
- A model or human grader is the only gate for deterministic behavior.
- The baseline is unknown or not comparable.
- Pass@k hides flaky behavior without reporting failed attempts.
- The eval records raw transcripts as the result instead of grader evidence.
- Cost, latency, external calls, or fixture privacy are undefined for a release gate.
