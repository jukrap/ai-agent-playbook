# Metric Definition Review

## Inventory

- Metric: name, owner, purpose, business question, unit, grain, denominator, numerator, expected direction.
- Source: source system, source table/query, transformation layer, freshness, partition/timezone, known exclusion.
- Dimension: segment, product, account, tenant, geography, cohort, channel, status, permission boundary.
- Consumer: dashboard, report, alert, experiment, finance review, product decision, operational workflow.

## Review

- Metric이 stated question에 답하는지, hidden caveat가 있는 proxy는 아닌지 확인합니다.
- Grain은 user, account, event, order, session, day, week, month, snapshot처럼 명시해야 합니다.
- Denominator와 exclusion은 numerator만큼 중요하며 둘 다 문서화합니다.
- Timezone, partial period, late-arriving data, dedupe, test/internal data, status transition을 확인합니다.
- Join이 row를 중복하거나 record를 조용히 drop하지 않아야 합니다.
- Segment filter가 해석을 크게 바꾸면 reader에게 보여야 합니다.

## Verification

- Source, transformed, reported layer 사이 row count를 reconcile합니다.
- Null, cancellation, refund, deleted user, retry, late data, boundary date 같은 edge case record를 sample합니다.
- 가능하면 known previous report 또는 hand-calculated small slice와 비교합니다.
- Grouped total이 overall total과 같거나 의도적으로 다른지 검증합니다.
- Caveat, freshness, confidence를 기록하되 precision을 과장하지 않습니다.

## Stop Conditions

- Metric owner, grain, denominator가 불명확합니다.
- Query output을 source 또는 trusted intermediate layer와 reconcile할 수 없습니다.
- Caveat가 숨겨진 상태로 dashboard/report가 decision을 유도합니다.
- Segmentation이 restricted 또는 misleadingly small population을 노출할 수 있습니다.
