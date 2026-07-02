# Retrieval Evaluation And Safety

Use this when reviewing retrieval quality, citations, access control, stale indexes, or vector/search provider boundaries.

## Evaluation

- Define representative questions, expected source documents, answerability, citation requirements, and negative cases.
- Measure recall, precision, citation correctness, stale-result rate, and no-answer behavior when possible.
- Include permission-filtered cases and restricted-document denial cases.
- Separate retrieval evidence from answer-generation quality when both exist.

## Safety And Freshness

- Keep embedding, vector, and network providers opt-in with privacy, cost, retention, and invalidation rules.
- Define index rebuild triggers for source changes, parser changes, chunking changes, embedding model changes, and metadata changes.
- Check that citations point to accessible, current, and relevant sources.
- Provide fallback behavior for stale index, provider outage, empty result, or access denied.

## Stop Conditions

- Retrieval can surface documents the user should not access.
- Index freshness, provider retention, or rebuild trigger is unknown.
- Citations are missing, stale, or not tied to source chunks.
- Evaluation uses only happy-path questions.
