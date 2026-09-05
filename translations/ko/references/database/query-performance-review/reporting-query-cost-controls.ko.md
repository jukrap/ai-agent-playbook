# Reporting Query Cost Controls

SQL이 report, dashboard, export, chart, scheduled email, PDF, spreadsheet, analytics table에 사용될 때 사용합니다.

## Consumer Evidence

- Query를 소비하는 report, dashboard, export, chart, API, scheduled job을 명시합니다.
- Required field, filter, grouping, ordering, paging, date/window semantic을 확인합니다.
- 가능하면 memory에서 alias를 손으로 쓰지 말고 실제 query/parser/API response에서 field name을 검증합니다.
- Consumer가 live data, cached data, snapshot, generated file 중 무엇을 기대하는지 확인합니다.

## Cost Controls

- Time range, row count, export size, full account scan, unfiltered dashboard를 제한합니다.
- 비싼 sync, export, full refresh 전에는 preview/estimate mode를 우선합니다.
- Full reprocess, full reindex, full export는 cost나 runtime이 의미 있으면 explicit confirmation 뒤에 둡니다.
- Query correctness와 rendered output correctness를 분리합니다. Query는 성공했지만 chart, report, export가 blank 또는 misbound일 수 있습니다.

## Verification

- Before/after query result count와 representative row comparison.
- Consumer가 있으면 rendered report/dashboard/export smoke check.
- Heavy report의 timeout, pagination, scheduling behavior check.
- Semantic이 바뀌었으면 caveat 또는 metric-definition update.

## Stop Conditions

- Report/dashboard field를 검증하지 않고 추측했습니다.
- Unbounded query가 export, scheduled report, dashboard refresh에 사용됩니다.
- Query change가 owner decision 없이 KPI 또는 business metric을 바꿀 수 있습니다.
- Binding, alias, grouping, pagination 변경 후 rendered consumer를 확인하지 않았습니다.
