# Grader And Metric Rubric

Prefer the cheapest grader that proves the behavior. Use judgment-based graders only for subjective quality, and keep them advisory unless the project defines a stable review process.

## Grader Types

| Grader | Use for | Evidence |
| --- | --- | --- |
| Code grader | CLI behavior, schema output, file generation, no-write guarantees, permissions | Exit code, parsed JSON, file inventory, diff check |
| Schema grader | MCP payloads, runtime artifacts, manifests, reports, catalog records | JSON schema, required fields, enum values, path constraints |
| Rule grader | Documentation hygiene, taxonomy rules, privacy checks, routing completeness | Regex checks, AST scans, lint reports, policy assertions |
| Snapshot grader | Stable text, markdown, manifest, or prompt output | Golden file diff with reviewed update process |
| Model grader | Subjective quality, synthesis quality, nuanced classification | Rubric prompt, sampled cases, disagreement notes, confidence caveats |
| Human grader | Product judgment, UX taste, policy acceptance, final release call | Review notes, explicit decision, reviewer role, date |

## Metric Choices

- `pass@1`: default for deterministic release gates.
- `pass@k`: useful for capability exploration; report every failed attempt and do not hide flakiness.
- `pass^k`: use when all repeated runs must pass to prove stability.
- `coverage`: count fixtures, workflows, tools, schemas, and failure modes covered by the eval.
- `cost`: record runtime, token, API, browser, or external-service cost when relevant.
- `latency`: record elapsed time for interactive tools, MCP prompts, and agent handoffs.
- `drift`: compare the current result with baseline output, accepted policy, or previous capability status.

## Threshold Policy

- Release gates need explicit fail thresholds and rollback or block behavior.
- Advisory evals can produce warnings, but the report must say they are advisory.
- High-risk evals need at least one deterministic grader unless the behavior is inherently subjective.
- Model graders need a fixed rubric, sampled examples, temperature/settings where available, and disagreement handling.
- Human graders need an explicit reviewer role and should not be replaced by a vague approval note.

## Anti-Overfitting Checks

- Keep fixture names and expected answers out of prompt instructions when possible.
- Include negative cases, malformed inputs, missing files, and permission-denied cases.
- Rotate at least some fixtures after major prompt or skill rewrites.
- Compare behavior against the original user instruction or policy, not just the latest implementation.
- Treat a suddenly perfect score after prompt changes as a review signal, not proof by itself.
