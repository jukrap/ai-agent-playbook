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
| Worklog | Background, reasoning, changes, affected repositories, decisions and assumptions, actual verification, unverified scope, next action |
| Topic knowledge | Current rule or contract, applicable repositories, sources, confirmation date, confirmed or assumed status, unresolved facts |

Do not turn missing optional fields into blockers. Use open questions only for decisions that materially affect the result. A contract must identify its actual source; never invent a schema from a name. A verification matrix should describe meaningful risks and checks, not repeat the implementation line by line.

## Evidence and record placement

Separate intended behavior from current code and observations. If they disagree, preserve the accepted requirement and document the gap. Narrow source reading to the affected artifact and expand only when evidence is missing. Linked global references and older worklogs do not require a full-history read.

Use CURRENT.md for a brief current objective, state, next action, and links. Keep reusable current facts in topic knowledge, and detailed milestone evidence in dated worklogs. New AAPB logs use `worklogs/YYYY-MM/`; preserve existing locations and create only the requested or needed record. Keep member-local records separate, identify applicable registered repositories, and obey local-only ownership rules. Record writing does not require a Git repository.

Preserve exact source locators, numbers, units, commands, and URLs within the permitted artifact. State which checks ran, what they established, and what remains unknown. Reused verification must identify the unchanged relevant inputs and conditions and comply with required gates. A shortened report must not erase these distinctions.

## Draft review

The main task can write the artifact directly. For an optional long independent draft, provide the selected format, destination, bounded facts, source locators, short relevant history, constraints, and unknowns. Preserve user model and reasoning choices and explicit role settings; use only supported host capabilities. Request a separate DRAFT, not direct replacement of shared current state or accepted knowledge.

The parent checks the draft's paths and source ranges, numbers, commands, URLs, decisions, and unverified states against the original evidence before incorporation. Retain unknowns that cannot be resolved. A role prompt does not enforce file permissions; an unreviewed draft is not an accepted specification or verified fact.

Commit and PR formatting belongs to configured project/host policy. No duplicated approval requirement is added here. Follow already granted authorization for local milestones; remote publication remains a separate scope.
