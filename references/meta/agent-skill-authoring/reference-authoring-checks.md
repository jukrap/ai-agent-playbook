# Reference Authoring Checks

Use this before adding long references, examples, stack details, or adopted external patterns.

## What belongs in references

- Detailed procedures that are too long for `SKILL.md`.
- Failure modes and stop conditions.
- Stack profiles and provider-specific caveats.
- Verification matrices and evidence contracts.
- Examples that are scrubbed, generic, and reusable.
- Patterns adopted from external material after rewriting into local guidance.

## What to keep out

- Personal paths, company names, customer names, internal URLs, credentials, tokens, branch names, and PR numbers.
- Long copied upstream excerpts.
- Project-specific magic values that do not generalize.
- Dated operational status that will become stale.
- Instructions that contradict the repository maintenance workflow or higher-priority project docs.

## Reference shape

- Start with when to use the reference.
- Keep sections task-oriented.
- Prefer checklists, matrices, and evidence requirements over broad essays.
- Keep examples short and scrubbed.
- Keep references one directory level below the skill.
- Add matching Korean translations for every English markdown file.

## Adoption checks

- Extract the durable pattern, not the source branding.
- Rewrite in the repository's taxonomy and terminology.
- Use capability language instead of vendor or project identity when possible.
- Preserve attribution only when licensing requires it.
- Add validators or CLI checks when the pattern affects install/sync behavior.

## Stop conditions

- The reference only makes sense with copied upstream context.
- The licensing or redistribution status is unclear.
- The content is better as local project memory than reusable skill guidance.
- The new reference would make everyday prompt context noisy without improving decisions.
