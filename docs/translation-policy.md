# Translation policy

English is the canonical functional source. Korean documents are human reading copies, maintained in the same change when English behavior or guidance changes.

## Functional parity and localized presentation

Commands, filenames, numeric limits, supported behavior, migration rules, and verification claims must agree. If a factual mismatch exists, compare the English source with current code and intended specifications, then correct both as needed.

Parity does not require identical introductions or page structure. Preserve the README's logo, badges, and language selector, and respect intentional Korean explanations or feature summaries. Translate for the reader: a Korean user should not need the English page to decipher mixed technical shorthand.

| Preserve exactly when applicable | Localize for comprehension |
| --- | --- |
| Command names, options, JSON fields, paths, URLs, numbers | Surrounding explanation, examples' prose, headings, and navigation labels |
| Functional conditions and uncertainty | Sentence order and natural Korean phrasing |
| Intentional tone and emphasis | Wording appropriate to the document's audience |

For example, explain `metadata` as management information and `cursor` as the value used to fetch the next result before relying on those terms. Keep the actual result field names in code formatting.

## File and installation rules

- Keep canonical skills, templates, docs, examples, and adapters in English.
- Put Korean copies under `translations/ko`, preserving source paths where possible.
- Use `.ko.md`; translated skills use the skill name rather than `SKILL.ko.md`.
- Never create installable `SKILL.md` files under translations or sync translations into user skill roots.
- The root README language selector may use native language names, including the Korean-language label.
- Keep translated links in the Korean reading path when a counterpart exists; adjust image and license paths for the deeper directory.

## Review meaning, not only coverage

Run translation and public-document checks. Then compare changed commands, conditions, and results, and read Korean paragraphs for clarity. A checker confirming one translated file per source does not verify completeness, tone, or preserved reader journeys.

Short agent skill entrypoints do not impose a length limit on beginner guides or reference manuals. If a section moves, preserve its discovery path in both languages. See [Maintenance](maintenance.md).
