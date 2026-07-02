# Data Integrity Review

Inputs: dataset 또는 report scope, source/target grain, owner, freshness target, known caveat.

Outputs: metric/data definition note, reconciliation check, data issue classification, handoff 또는 contract update.

Skills: data pipeline review, analytics reporting review, data migration integrity, storage 변경이 있으면 database change safety.

Tools: `route-api-hints`, `operator search`, `operator map`, `workflow run-preview`, 가능한 경우 query/report check.

Stop conditions: 알 수 없는 metric owner, 접근할 수 없는 source data, 불명확한 grain 또는 denominator, 검토되지 않은 destructive repair.

Verification: source count, sampled row, reconciliation query, report/dashboard consistency, freshness와 caveat review.

