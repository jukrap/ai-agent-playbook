---
name: ci-quality-gate
description: Use when deciding CI quality gates before merge, release, handoff, or publication.
---

# CI Quality Gate

merge, release, handoff 전에 check가 충분한지 판단하기 위한 primary delivery skill입니다.

## Workflow

1. change scope, target branch 또는 release surface, gate owner, required check, optional check, allowed skip policy를 확인합니다.
2. package script, CI config, docs, workflow recipe, 이전 run evidence에서 project-defined check를 inventory합니다.
3. 관련 check를 pass, fail, skipped, unavailable, stale, not applicable로 분류하고 source를 다시 열 수 있는 locator를 붙입니다.
4. missing 또는 failing required check는 owner가 residual risk를 명시적으로 수락하지 않는 한 blocked로 봅니다.
5. gate summary, blocked check, skipped check, verification command, evidence locator, remaining risk를 handoff에 기록합니다.

## Reference

gate scope, status, stop condition을 판단할 때 `references/gate-model.md`를 읽습니다.

handoff, PR, release, audit note를 위해 check evidence를 패키징할 때 `references/evidence-package.md`를 읽습니다.
