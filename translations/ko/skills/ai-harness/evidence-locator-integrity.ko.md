---
name: evidence-locator-integrity
description: Use when claims need reopenable locators, scan ranges, source boundaries, or evidence caveats.
---

# Evidence Locator Integrity

Claim을 신뢰하거나 인용하거나 승격하기 전에 evidence를 다시 열어볼 수 있는지 확인하는 기본 AI harness skill입니다.

## Workflow

1. Claim을 code behavior, structure, absence, risk, runtime report, source registry entry, external source, command output, data result, manual observation 중 하나로 분류합니다.
2. Target context에서 다시 열 수 있는 locator를 붙입니다. Path range, symbol, runtime artifact, source registry item, command output, URL, issue, database/query, manual observation record를 사용합니다.
3. Absence, coverage, "no usages found" claim에는 scan range, 사용한 tool, skipped path, freshness를 적은 뒤 evidence로 취급합니다.
4. Local absolute path, credential처럼 보이는 값, private endpoint, uncapped excerpt, stale generated summary, missing source boundary가 포함된 evidence는 거부하거나 claim을 약하게 표현합니다.
5. Generated evidence는 reviewed promotion step이 stable fact를 memory, canon, docs, handoff로 명시적으로 옮기기 전까지 runtime 아래에 둡니다.

## Reference

Reusable locator shape, required field, source-boundary rule은 `references/locator-contract.ko.md`를 읽습니다.

Claim type, scan range requirement, absence-claim rule, unsafe evidence anti-pattern은 `references/claim-scan-range-rules.ko.md`를 읽습니다.
