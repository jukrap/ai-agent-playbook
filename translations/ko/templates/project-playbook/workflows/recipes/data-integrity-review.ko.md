# Data Integrity Review

Inputs: dataset scope, report scope, event scope, retrieval scope, source/target grain, contract owner, lineage scope, quality dimension, freshness target, consumer list, access model, known caveat.

Outputs: metric/data definition note, contract/lineage note, quality check plan, reconciliation check, data issue classification, instrumentation caveat, retrieval caveat, handoff note, contract update.

Skills: data pipeline review, data contract lineage review, data quality observability, analytics reporting review, analytics instrumentation review, knowledge retrieval pipeline review, data migration integrity, storage 변경이 있으면 database change safety.

Tools: `route-api-hints`, `operator search`, `operator map`, `dependency inventory`, `index status`, `workflow run-preview`, `canon check`, `write-gate preview`, query check, report check, event check, retrieval check.

Stop conditions: 알 수 없는 metric 또는 contract owner, 접근할 수 없는 source data, 불명확한 grain 또는 denominator, 알 수 없는 freshness target, bounded하지 않은 quality check 또는 repair, 알 수 없는 retrieval access control, 알 수 없는 event consent/privacy status, 검토되지 않은 destructive repair.

Verification: source count, sampled row, reconciliation query, contract/lineage review, quality check evidence, report/dashboard consistency, event payload sample, retrieval evaluation, freshness와 caveat review.
