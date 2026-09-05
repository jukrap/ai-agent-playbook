# Spec Worklog Promotion

## Inventory

- Source material: worklog, active plan, completed run, handoff, runtime report, review finding, ADR, spec, map.
- Destination: current context, map, runbook, contract, glossary, decision record, project spec, archive, monthly summary.
- Durability: current rule, stable fact, completed milestone, open question, blocker, historical note, generated evidence.
- Audience: future agent, human maintainer, reviewer, operator, product owner, auditor.

## Review

- Raw transcript text가 아니라 durable fact를 승격합니다.
- Generated evidence는 review 전까지 runtime 아래에 둡니다. Memory에는 human-trusted conclusion이 들어가야 합니다.
- Current rule은 policy 또는 `AGENTS.md`, product fact는 spec, operational procedure는 runbook에 둡니다.
- Worklog는 왜/무엇이 바뀌었는지를 설명하고, map/spec은 현재 상태를 설명합니다.
- Stale note는 active guidance에 남겨두지 말고 archive합니다.
- Uncertainty는 fact처럼 제시하지 말고 open question으로 보존합니다.

## Verification

- Promoted fact를 code, config, test, docs 또는 reviewed runtime report와 cross-check합니다.
- Destination path가 local-only/public-doc policy에 맞는지 확인합니다.
- Plan/worklog의 fact를 map/spec/runbook으로 옮기면 link나 reference를 갱신합니다.
- Commit되는 documentation이면 public-doc hygiene check를 실행합니다.
- Follow-up work가 남으면 짧은 handoff note를 남깁니다.

## Stop Conditions

- Source evidence가 review되지 않았습니다.
- Target document의 role이 불명확합니다.
- Promotion이 existing current guidance를 duplicate하거나 contradict합니다.
- Note에 secret, personal path, internal URL, branch name, PR number가 포함되어 있습니다.
