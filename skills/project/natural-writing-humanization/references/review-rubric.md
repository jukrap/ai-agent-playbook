# Natural Writing Review Rubric

Use this rubric before returning edited prose or reviewing a documentation change.

## Score 0: Blocked

- The request asks for detector bypass, fake authorship, policy evasion, or misrepresentation.
- The source facts are too unclear to edit safely.
- The rewrite would change a legal, security, release, or contractual claim without owner review.

## Score 1: Needs Revision

- The text still depends on generic praise, stiff translationese, or repeated template phrases.
- The edit removes caveats, warnings, file paths, command names, or exact technical terms.
- Korean text keeps English sentence order or unexplained English terms that slow the reader down.
- English text still uses broad AI-writing framing instead of concrete claims.

## Score 2: Good Enough

- Meaning and identifiers are preserved.
- The main action, decision, caveat, or evidence is clear.
- Only a few mild formulaic phrases remain, and they do not block reader understanding.
- The text fits the audience and document type.

## Score 3: Strong

- The prose sounds like a domain-aware maintainer wrote it for the intended reader.
- Claims are concrete, caveats are visible, and the rhythm is varied without being theatrical.
- Korean text uses natural Korean flow with necessary English terms only.
- English text is direct, specific, and free of padded framing.

## Final Pass

- Reopen the source and compare facts line by line for sensitive sections.
- Check headings, bullets, and examples for the same voice.
- For translated docs, ensure source and translation make the same promise and carry the same warnings.
- When using `writing naturalness-check`, treat findings as heuristics and explain any ignored finding.
