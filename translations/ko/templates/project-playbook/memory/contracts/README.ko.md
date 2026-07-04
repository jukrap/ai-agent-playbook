# Contracts

Contracts는 중요한 business rule, invariant, verification expectation을 기록합니다.

승인된 contract는 `active/`, 초안은 `pending/`에 둡니다. 이 playbook의 contract check는 read-only입니다. Commit을 막지 않고, AI judge를 호출하지 않고, 파일을 수정하지 않습니다.

Contract frontmatter:

```yaml
---
id: payment-cancel
status: active
appliesTo:
  - src/payments/**/*.ts
risk: high
approvedAt: 2026-06-14
freshness: 2026-06-14
---
```

권장 섹션:

```markdown
## Rule

## Applies to

## Required evidence

## Open questions
```

Contracts는 명시적으로 확인합니다.

```powershell
npx ai-agent-playbook contracts list <target-repo> --json
npx ai-agent-playbook contracts check <target-repo> --path src/example.ts --json
```

Check는 matching active/pending contract, 오래된 freshness date, 사라진 `appliesTo` path, 비어 있는 required-evidence section을 보고합니다. 규칙 준수 여부를 자동 증명하지는 않습니다.
