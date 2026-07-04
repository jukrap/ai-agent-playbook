# Korean Naturalness Patterns

Use this reference for Korean README text, docs, release notes, PR bodies, guides, summaries, and translated material.

## Primary Checks

- Preserve facts first: product names, command names, file paths, error messages, numbers, dates, versions, and risk warnings must survive unchanged unless the source is wrong.
- Prefer Korean sentence order over English sentence order. Put the actor and action early, then add condition, reason, or caveat.
- Keep technical terms in English only when they are command names, API names, proper nouns, common industry terms, or clearer than a Korean substitute.
- Explain a new English term once, then use the shorter stable term afterward.
- Split long template-like sentences into factual short sentences when the prose is instructional or operational.

## Translationese Signals

- Repeated polite possibility, passive, or vague evidential endings.
- Template connectors equivalent to "through this", "not only", "also", "therefore", "from a perspective", or "in terms of" when every paragraph uses them.
- Abstract role or value claims equivalent to "plays an important role", "contributes to", "provides the best experience", or "provides powerful functionality" without concrete evidence.
- English noun stacks inside Korean prose, especially when the surrounding sentence already explains the concept.
- Overly polite distance in operational docs where a direct instruction is clearer.

## Rewrite Moves

- Replace a "through this, users can X" sentence with "users X" when no causal claim is needed.
- Replace a "not only A but also B" sentence with two direct claims, or keep only the claim that matters.
- Replace repeated passive verbs with an owner or system action.
- Replace broad value claims with observable behavior: for example, say which invalid paths, binary files, large files, or unsafe inputs are rejected.
- Keep a little spoken naturalness in Korean summaries. A short sentence is often better than a perfectly symmetric paragraph.

## Review Questions

- Does the Korean text sound like someone would write it after understanding the system, not like a line-by-line translation?
- Can a reader tell what to do next without decoding English-heavy phrasing?
- Are terms consistent across the document and its Korean translation?
- Did the edit accidentally soften a warning, change a command, or hide a caveat?
