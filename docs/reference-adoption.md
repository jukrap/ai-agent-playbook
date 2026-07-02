# Reference Adoption

External references are useful, but everyday agent prompts should not carry noisy source lists. Adopt references by converting them into local capabilities, recipes, and concise references.

## Adoption Steps

1. Inventory the source material.
2. Classify each item by capability category.
3. Extract durable practices, constraints, and verification checks.
4. Place short trigger guidance in `SKILL.md`.
5. Place reusable detail in `references/`.
6. Add workflow recipes when the source describes a repeatable process.
7. Record major design decisions in docs or worklogs.

## Keep Out

- Personal absolute paths.
- Company names and internal URLs.
- Credentials, tokens, branch names, issue numbers, and PR numbers.
- Raw copied references that are too long to be useful at trigger time.

