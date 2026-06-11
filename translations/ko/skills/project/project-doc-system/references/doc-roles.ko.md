# Project Documentation Roles

## Recommended files

- `AGENTS.md`: playbook과 가장 가까운 local rule을 가리키는 얇은 agent 진입점.
- `README.md`: public setup and run guide.
- `PROJECT_SPEC.md`: 프로젝트가 사용할 때 product goal, screens, feature scope, API/data policies.
- `PLANS.md`: 프로젝트가 사용할 때 milestones, completion criteria, verification commands.
- `FSD.md`: repository가 실제로 FSD를 사용할 때만 architecture boundary rules.
- `.ai-playbook/README.md`: agent-facing project memory index and source-of-truth rules.
- `.ai-playbook/START_HERE.md`: 다음 agent를 위한 가장 짧은 resume guide.
- `.ai-playbook/CURRENT.md`: current baseline, active risks, decisions that still matter.
- `.ai-playbook/SKILLS.md`: project-level skill selection policy.
- `.ai-playbook/GIT.md`: 짧은 Git, commit, PR, push policy.
- `.ai-playbook/maps/**`: repository, runtime, API, route, data, risk maps.
- `.ai-playbook/runbooks/**`: repeatable commands and operational procedures.
- `.ai-playbook/decisions/**`: durable decisions with rationale and evidence.
- `.ai-playbook/plans/**`: active execution plans only.
- `.ai-playbook/worklogs/**`: detailed milestone, blocker, direction-change, debugging records.
- `.ai-playbook/archive/**`: stale plans, old handoffs, retired notes.
- `design-docs/**`, `_reference/**`: secondary references.
- `.ai-playbook/guides/runtime-roadmap.md`: runtime hook이 project docs를 대체하지 않고 보강해도 되는지 판단하는 선택적 guidance.

## Source-of-truth priority

1. 최신 사용자 지시.
2. 실제 code, config, command output.
3. Root and nearest agent instruction files.
4. `.ai-playbook/CURRENT.md`, maps, runbooks, decisions의 current project memory.
5. Project-specific planning/spec docs.
6. Worklogs, old plans, examples, handoffs, archived notes.

## Cleanup rules

- 루트 에이전트 지침은 안정적인 진입점이 될 만큼 짧게 유지합니다.
- current project truth는 `.ai-playbook/CURRENT.md`에 둡니다.
- structural facts는 `.ai-playbook/maps/`에 둡니다.
- repeated commands는 `.ai-playbook/runbooks/`에 둡니다.
- live plans는 `.ai-playbook/plans/`에 둡니다.
- detailed history는 `.ai-playbook/worklogs/`에 둡니다.
- stale plans, prompts, handoffs는 archive합니다.
- current facts는 worklogs에서 `CURRENT.md`, maps, runbooks, decisions로 승격합니다.
- 흩어진 반복 지침보다 index document 하나를 선호합니다.
- Hook-specific behavior는 선택적이고 문서화된 상태로 유지합니다. Runtime state가 project policy의 유일한 source가 되면 안 됩니다.
