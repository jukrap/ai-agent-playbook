---
name: pre-action-fact-gate
description: Use when risky edits need importers, schemas, owner search, blast radius, or rollback facts first.
---

# Pre Action Fact Gate

넓은 영향 범위, destructive action, 새 ownership 생성, 고위험 작업 전에 구체적인 fact를 모으는 기본 AI harness skill입니다.

## Workflow

1. 최신 user intent, target action, target path, risk type, advisory/apply 여부를 다시 적습니다.
2. Existing owner, importer/caller, public API, data schema, contract, nearby pattern, verification command, rollback path를 bounded fact로 모읍니다.
3. New file이나 ownership change 전에는 existing domain cluster, naming pattern, lifecycle owner, deletion path를 확인합니다.
4. Destructive 또는 applied action에는 explicit instruction, dry-run 또는 write-gate preview evidence, resolved target list, rollback evidence가 필요합니다.

## Reference

Action type별 bounded fact set과 evidence standard는 `references/fact-gate-checks.ko.md`를 읽습니다.

Delete, move, rewrite, migration, publish/deploy action, write-tier escalation은 `references/destructive-action-review.ko.md`를 읽습니다.
