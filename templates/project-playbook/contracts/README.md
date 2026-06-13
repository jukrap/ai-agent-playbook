# Contracts

Contracts capture important business rules, invariants, and verification expectations.

Use `active/` for approved contracts and `pending/` for drafts. Contract checks are read-only in this playbook. They do not block commits, call an AI judge, or edit files.

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

Recommended sections:

```markdown
## Rule

## Applies to

## Required evidence

## Open questions
```

Check contracts explicitly:

```powershell
npx ai-agent-playbook contracts list <target-repo> --json
npx ai-agent-playbook contracts check <target-repo> --path src/example.ts --json
```

The check reports matching active or pending contracts, stale freshness dates, missing `appliesTo` paths, and empty required-evidence sections. It does not prove the rule automatically.
