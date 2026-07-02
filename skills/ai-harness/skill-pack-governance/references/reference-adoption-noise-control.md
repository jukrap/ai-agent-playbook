# Reference Adoption Noise Control

Use this when adopting external harnesses, skill packs, examples, or project references into reusable local guidance.

## Adoption Path

- Inventory the reference and classify useful patterns by capability.
- Extract durable practices, constraints, workflows, and verification checks.
- Rewrite into local skills, references, recipes, tests, and docs instead of copying raw source.
- Keep provenance and source notes out of everyday prompts unless the source identity is required for licensing or attribution.

## Noise To Remove

- Personal absolute paths.
- Company names, customer names, internal URLs, credentials, tokens, branch names, PR numbers, and dated operational status.
- Large upstream excerpts that make prompts heavy without improving decisions.
- Project-specific magic values that do not generalize.

## Useful Patterns To Keep

- Clear trigger routing.
- Required evidence and stop conditions.
- Dry-run first behavior.
- Credential indirection and destructive-action confirmation.
- Validation scripts and catalog checks.
- Separation between generated output and reviewed memory.

## Stop Conditions

- The adoption copies raw reference text instead of converting it into local capability guidance.
- Source-specific noise would become default prompt context.
- Licensing, attribution, or redistribution constraints are unclear.
- The adopted content cannot be validated by local tests, docs, or catalog checks.
