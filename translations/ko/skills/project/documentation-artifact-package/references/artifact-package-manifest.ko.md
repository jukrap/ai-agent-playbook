# Artifact Package Manifest

Documentation package를 bounded하고 review 가능하게 만들기 위해 manifest를 사용합니다.

## Manifest 필드

- Title과 package type.
- Audience와 intended use.
- Owner와 reviewer.
- Date, freshness window, next review trigger.
- Included artifacts: docs, runbook, diagram, screenshot, report, decision, contract, map, example.
- Source evidence: 검토된 file, command, report, log, screenshot, query, external reference.
- Excluded sources: raw transcript, unreviewed generated summary, private note, local-only evidence, noisy reference.
- Caveat와 open question.
- Verification performed와 verification skipped.
- Maintenance path, archive path, promotion rule.

## Boundary 규칙

- Package는 자동으로 source of truth가 아닙니다. 포함된 docs 중 무엇이 durable policy이고 무엇이 evidence인지 표시합니다.
- Generated runtime report는 검토와 승격 전까지 runtime 아래에 둡니다.
- Raw note는 decision을 정당화할 수 있지만 기본적으로 published documentation이 되면 안 됩니다.
- Public package에는 private path, credential, internal URL, branch name, PR number, personal name, raw reference excerpt를 넣지 않습니다.

## Evidence 품질

- Pasted output보다 검토된 artifact를 가리키는 link 또는 portable path를 선호합니다.
- Reader가 freshness와 completeness를 판단할 수 있을 만큼의 맥락을 포함합니다.
- Partial evidence를 명시적으로 표시합니다.
- Large table, screenshot, export, raw report가 reader를 압도하면 main doc 밖에 둡니다.

## 중단 조건

- Target audience가 불명확합니다.
- Package가 active policy, stale history, generated evidence를 label 없이 섞습니다.
- Maintenance 또는 archival owner가 없습니다.
- Sensitive source material을 안전하게 요약할 수 없습니다.
