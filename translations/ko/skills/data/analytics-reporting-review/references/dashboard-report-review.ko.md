# Dashboard Report Review

## Inventory

- Artifact: dashboard, static report, notebook, CSV export, chart widget, slide, PDF, scheduled email.
- Audience: executive, product, engineering, support, sales, finance, operations, external reader.
- Visual: chart type, axis, unit, legend, label, sorting, filter, table column, drilldown.
- Data contract: refresh schedule, source freshness, partial data behavior, access boundary, caveat.

## Review

- Trend, rank, part-to-whole, distribution, correlation, table lookup 등 비교 방식에 맞는 visualization을 사용합니다.
- Title과 subtitle은 filter나 caveat를 숨기지 않으면서 metric과 insight를 말해야 합니다.
- Axis, unit, date range, denominator는 보이거나 쉽게 찾을 수 있어야 합니다.
- Table에는 plotted field뿐 아니라 review에 필요한 dimension을 포함합니다.
- Source confidence보다 높은 chart precision을 피합니다.
- Handoff 전에 empty, partial, delayed, permission-limited state를 확인합니다.

## Verification

- Chart total과 table/query total을 비교합니다.
- Sorting, grouping, stacked/grouped series, legend visibility를 확인합니다.
- Filter와 date control이 모든 dependent view를 일관되게 바꾸는지 검증합니다.
- Report가 small screen 또는 export format에서 소비된다면 해당 형태를 확인합니다.
- Freshness, sampling, access limitation, metric definition caveat를 포함합니다.

## Stop Conditions

- Chart 또는 table이 undefined metric을 사용합니다.
- Visible "by segment" claim에 visible grouping 또는 encoding이 없습니다.
- Filter, date range, permission 때문에 block 간 수치가 서로 어긋납니다.
- Report가 data complete, delayed, sampled, partial 여부를 reader에게 알려주지 못합니다.
