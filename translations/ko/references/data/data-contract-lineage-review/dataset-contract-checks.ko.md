# Dataset Contract Checks

Table, event, file, API payload, BI dataset, mart, export, workflow payload가 shared data contract가 될 때 사용합니다.

## Contract Shape

- Owner, source of truth, dataset grain, primary identifier, time window, partitioning, retention, freshness target을 명시합니다.
- Field meaning, unit, nullability, enum/range expectation, timezone, currency, denominator, known exclusion을 정의합니다.
- Raw source field와 derived field/generated evidence를 구분합니다.
- Added, renamed, removed, retyped, backfilled field의 compatibility expectation을 기록합니다.

## Review Checks

- 알려진 producer, transformation, consumer, dashboard, export, job, API를 모두 확인합니다.
- Consumer가 undocumented field, implicit filter, load order, old naming에 의존하는지 확인합니다.
- Late-arriving, duplicated, deleted, corrected record가 어떻게 표현되는지 확인합니다.
- Credential, private URL, raw query output, direct personal path는 reusable contract docs에 넣지 않습니다.

## Stop Conditions

- Dataset grain, owner, source of truth, freshness target이 불명확합니다.
- Field meaning 변경에 consumer impact review가 없습니다.
- Contract evidence가 source ownership 없는 generated output 또는 sample뿐입니다.
- Private connection detail이나 raw source dump가 public docs에 들어갑니다.
