---
name: evidence-locator-integrity
description: Use when claims need reopenable locators, scan ranges, source boundaries, or evidence caveats.
---

# Evidence Locator Integrity

Use this as the primary AI harness skill for checking whether evidence can be reopened before a claim is trusted, cited, or promoted.

## Workflow

1. Classify the claim as code behavior, structure, absence, risk, runtime report, source registry entry, external source, command output, data result, or manual observation.
2. Attach a locator that can be reopened from the target context: path range, symbol, runtime artifact, source registry item, command output, URL, issue, database/query, or manual observation record.
3. For absence, coverage, or "no usages found" claims, record the scan range, tools used, skipped paths, and freshness before treating the claim as evidence.
4. Reject or soften evidence that contains local absolute paths, credential-looking values, private endpoints, uncapped excerpts, stale generated summaries, or missing source boundaries.
5. Keep generated evidence under runtime until a reviewed promotion step explicitly moves stable facts into memory, canon, docs, or handoffs.

## Reference

Read `references/locator-contract.md` for reusable locator shapes, required fields, and source-boundary rules.

Read `references/claim-scan-range-rules.md` for claim types, scan range requirements, absence-claim rules, and unsafe evidence anti-patterns.
