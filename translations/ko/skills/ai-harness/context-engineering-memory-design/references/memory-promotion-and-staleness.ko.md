# Memory Promotion And Staleness

Generated evidence, worklog, decision, map, contract를 durable project memory로 옮길 때 사용합니다.

## Promotion Criteria

- Fact가 reviewed, current, portable하고 한 번의 run을 넘어 유용합니다.
- Source는 private path나 credential을 누출하지 않고 명시됩니다.
- Destination이 map, contract, decision, glossary, runbook, worklog, handoff, archive 중 적절합니다.
- Existing memory와의 conflict가 해결되었거나 open question으로 기록됩니다.

## Generated Evidence

- Runtime report, index, dry-run output, screenshot, graph, tool summary는 generated evidence입니다.
- Generated evidence는 decision을 뒷받침할 수 있지만 그 자체로 trusted memory는 아닙니다.
- Raw evidence는 검토 전까지 `runtime/` 또는 동등한 generated-output 영역에 둡니다.
- Full report가 아니라 concise fact, decision, contract를 승격합니다.

## Staleness Checks

- 가능하면 memory fact를 current file, manifest, contract, worklog와 비교합니다.
- Stale, missing, changed, unverified, superseded fact를 명시합니다.
- Historical worklog는 history로 보존하되 old worklog가 current code와 user instruction을 덮어쓰지 않게 합니다.
- Freshness를 확인할 수 없으면 certainty를 주장하지 않고 remaining risk를 기록합니다.

## Stop Conditions

- Source evidence가 unreviewed, private, generated-only, contradictory입니다.
- Promotion이 secret, direct personal path, internal URL, branch name, PR number, raw chat transcript를 저장합니다.
- Fact에 owner, date, source, replacement path가 없습니다.
- Runtime output을 memory에 wholesale copy하려고 합니다.
