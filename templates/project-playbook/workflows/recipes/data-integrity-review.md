# Data Integrity Review

Inputs: dataset or report scope, source and target grain, owners, freshness target, known caveats.

Outputs: metric/data definition notes, reconciliation checks, data issue classification, handoff or contract update.

Skills: data pipeline review, analytics reporting review, data migration integrity, database change safety when storage changes are involved.

Tools: `route-api-hints`, `operator search`, `operator map`, `workflow run-preview`, query/report checks when available.

Stop conditions: unknown metric owner, inaccessible source data, unclear grain or denominator, unreviewed destructive repair.

Verification: source counts, sampled rows, reconciliation queries, report/dashboard consistency, freshness and caveat review.

