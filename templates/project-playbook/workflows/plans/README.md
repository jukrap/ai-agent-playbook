# Plans

Keep only active execution plans here.

From this repository, scaffold a dated plan file with:

```powershell
node .\bin\aapb.mjs plan new <target-repo> --title "short-plan-title"
```

## Rules

- A plan should be decision-complete enough for another agent to execute.
- Include scope, out-of-scope items, files or areas to inspect, verification, risks, and commit boundaries.
- Archive completed, superseded, or stale plans under `../archive/`.
- Do not use `plans/` as a catch-all for maps, notes, prompts, or old handoffs.
- Add commit checkpoints for large or mixed-scope work so future agents do not turn everything into one oversized commit.

## Suggested shape

```md
# Plan Title

## Goal

## Scope

## Steps

## Verification

## Commit checkpoints

## Risks
```
