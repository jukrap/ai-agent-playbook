---
name: forge-automation-control
description: Use when coordinating or automating resumable work through GitHub or Gitea issues, pull requests, actions, scheduled ticks, or local fallback runs.
---

# Forge Automation Control

Forge 연계 작업을 재개 가능하고 review 가능하게 유지하면서, forge가 없을 때도 안전하게 동작하도록 만드는 skill입니다.

## Workflow

1. Remote write를 제안하기 전에 repository state, remote, authentication, configured provider, 현재 deny flag를 확인합니다.
2. Effective permission profile을 결정합니다. User instruction, project setting, CLI flag, provider capability 중 가장 제한적인 조건을 적용합니다.
3. 승인된 structured plan을 검증한 뒤, plan에서 만든 task 또는 configured ready label이 있는 기존 issue만 queue에 넣습니다.
4. 한 번에 하나의 idempotent tick을 실행합니다. Ready task 하나를 claim하고, budget 안에서 실행하며, controller에서 verification을 다시 수행하고, evidence와 checkpoint를 기록합니다.
5. 의미 있는 transition, blocker, reconciliation request, final verification만 동기화합니다. Managed issue, marker comment, branch, draft pull request를 재사용합니다.
6. 실행 중 requirement가 바뀌거나, lease 또는 permission이 불확실하거나, verification이 반복 실패하거나, high-risk action에 승인이 필요하면 pause합니다.
7. Remote access가 없거나 금지되면 local ledger로 fallback합니다. Remote synchronization을 local progress의 전제 조건으로 취급하지 않습니다.

## Safety Boundaries

- 모든 profile에서 merge, release, delete, force-push, protected-branch write는 approval-bound로 유지합니다.
- Forge credential을 configuration, prompt, worker environment, ledger, evidence, log에 넣지 않습니다.
- Worker가 push하거나 forge state를 변경하지 못하게 합니다. Delivery 전에 controller가 file과 verification을 review합니다.
- 사용자의 working checkout을 보존합니다. Unattended execution에는 managed isolated checkout을 사용합니다.

## Related Skills

- Approved plan을 independently reviewable child issue로 나누고 기존 ready-label work를 분류할 때 `issue-planning-triage`를 사용합니다.
- Executor 또는 review worker에 bounded contract, evidence ownership, reconciliation handoff가 필요하면 `agent-orchestration-handoff`를 사용합니다.
- Controller staging, commit, push, draft pull request, durable worklog update 전에는 `git-worklog-guardrails`를 사용합니다.

## References

GitHub 또는 Gitea를 감지하거나 remote artifact를 계획하거나 capability fallback을 선택할 때 `references/provider-capabilities.ko.md`를 읽습니다.

Task transition, queue label, progress, permission profile, deny flag, approval gate를 결정할 때 `references/state-and-permissions.ko.md`를 읽습니다.

Tick, supervisor, Actions, local scheduler, lease, crash recovery, unattended Git delivery를 설정할 때 `references/scheduler-and-recovery.ko.md`를 읽습니다.
