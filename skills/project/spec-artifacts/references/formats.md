# Selected artifact formats

Use the existing repository template first. Scale the fields to the decision.

| Artifact | Minimum useful content |
| --- | --- |
| Specification | Problem, intended behavior, constraints, acceptance criteria |
| ADR | Decision, reason, relevant alternatives, consequences |
| Contract | Producer/consumer, existing and new shape, compatibility, failure behavior |
| Migration | Starting state, preview, apply, conflict handling, validation, rollback |
| Handoff | Complete, remaining, constraints, evidence, next action |
| Release note | User-visible change, compatibility, required action, known limits |
| Verification record | Command or observation, environment, result, skipped scope |

Do not turn missing optional fields into blockers. Use open questions only for decisions that materially affect the result. A contract must identify its actual source; never invent a schema from a name. A verification matrix should describe meaningful risks and checks, not repeat the implementation line by line.

Commit and PR formatting belongs to configured project/host policy. No duplicated approval requirement is added here. Follow already granted authorization for local milestones; remote publication remains a separate scope.
