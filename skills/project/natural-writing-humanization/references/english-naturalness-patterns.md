# English Naturalness Patterns

Use this reference for English README text, docs, product notes, PR descriptions, release notes, and handoffs.

## Primary Checks

- Keep the subject and verb close. Prefer “The command checks X” over broad setup such as “This serves as a robust way to...”.
- Replace generic praise with observable behavior, limits, or evidence.
- Vary sentence length only when it improves clarity; do not add drama to make a paragraph look more human.
- Keep useful directness. Technical readers usually prefer exact caveats over polished optimism.
- Preserve terms that are identifiers: command names, file paths, config keys, API fields, versions, and product names.

## AI-Writing Signals

- Broad framing: `in today's fast-paced landscape`, `the realm of`, `delve into`, `a tapestry of`, `it is important to note`.
- Inflated value words: `pivotal`, `crucial`, `transformative`, `game-changing`, `seamless`, `robust`, `comprehensive`, `powerful`.
- Symmetric padding: `not only ... but also ...`, repeated three-part lists, and paragraphs that all end with the same benefit claim.
- Comma-led participle padding: `, ensuring`, `, highlighting`, `, underscoring`, `, allowing`, `, enabling` when the clause repeats the prior sentence.
- Excessive em dashes, rhetorical contrasts, and staged transitions in otherwise practical docs.

## Rewrite Moves

- Replace “This powerful tool enables users to...” with “Use this command to...” or “The command reports...”.
- Replace abstract benefits with a checkable result: “improves reliability” -> “fails when a path leaves the project root”.
- Remove throat-clearing before the real claim. Start with the claim.
- Break a padded sentence into one decision and one caveat.
- Keep confidence proportional to evidence. Use “reports”, “checks”, “suggests”, and “flags” when the system is heuristic.

## Review Questions

- Would this sentence still be true if the adjective disappeared?
- Is the paragraph giving the reader a decision, a command, a caveat, or just mood?
- Are caveats and limits visible enough for someone to act safely?
- Did the edit preserve all technical identifiers exactly?
