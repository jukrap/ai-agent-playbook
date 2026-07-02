# Data Integrity Review

Inputs: dataset scope, report scope, event scope, retrieval scope, source and target grain, contract owner, lineage scope, quality dimensions, freshness target, consumer list, access model, known caveats.

Outputs: metric/data definition notes, contract and lineage notes, quality check plan, reconciliation checks, data issue classification, instrumentation caveats, retrieval caveats, handoff note, contract update.

Skills: data pipeline review, data contract lineage review, data quality observability, analytics reporting review, analytics instrumentation review, knowledge retrieval pipeline review, data migration integrity, database change safety when storage changes are involved.

Tools: `route-api-hints`, `operator search`, `operator map`, `dependency inventory`, `index status`, `workflow run-preview`, `canon check`, `write-gate preview`, query checks, report checks, event checks, retrieval checks.

Stop conditions: unknown metric or contract owner, inaccessible source data, unclear grain or denominator, unknown freshness target, unbounded quality check or repair, unknown retrieval access control, unknown event consent/privacy status, unreviewed destructive repair.

Verification: source counts, sampled rows, reconciliation queries, contract/lineage review, quality check evidence, report/dashboard consistency, event payload samples, retrieval evaluation, freshness and caveat review.
