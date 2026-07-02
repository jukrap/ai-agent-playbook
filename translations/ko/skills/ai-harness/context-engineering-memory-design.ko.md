# Context Engineering Memory Design

Context surface와 durable project memory를 위한 primary AI harness skill입니다.

## Workflow

1. 각 항목을 always-on instruction, project-local context, selected skill reference, generated runtime evidence, durable memory, handoff, archive로 분류합니다.
2. Default context는 작고 안정적으로 유지하며 raw source list, secret, personal path, branch name, PR number, large excerpt를 넣지 않습니다.
3. Runtime report, index, dry-run output, generated graph는 검토와 승격 전까지 evidence candidate로 다룹니다.
4. Fact가 충돌하면 project docs, canon check, worklog, explicit owner decision으로 context freshness를 검증합니다.

## Reference

Prompt/cache budget과 context surface placement에는 `references/context-surface-and-cache-budget.md`를 읽습니다.

Generated evidence, durable memory, stale fact, promotion check에는 `references/memory-promotion-and-staleness.md`를 읽습니다.
