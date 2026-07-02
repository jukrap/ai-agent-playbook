# Agent Orchestration Handoff

Inputs: orchestration goal, worker count 또는 review pass, task boundary, allowed path, required read, tool limit, context budget, write permission tier, evidence locator format, merge/review owner.

Outputs: worker contract, evidence ledger, reconciliation summary, accepted finding, rejected 또는 superseded claim, blocker, verification result, handoff note, promotion decision.

Skills: agent orchestration handoff, context engineering memory design, pre-action fact gate, evidence locator integrity, capability witness history, git worklog guardrails.

Tools: `workflow run-preview`, `operator search`, `operator preflight`, `index status`, `evidence locator-check`, `runtime schema-check`, `write-gate preview`, `run status`, `run record`, project-defined verification command.

Stop conditions: worker scope가 불명확함, 두 write worker가 같은 file을 대상으로 함, required read 누락, allowed write tier가 unsafe함, evidence를 다시 열 수 없음, private data가 shared output에 들어감, generated summary가 source evidence와 충돌함, reviewer가 충돌하는 claim을 reconcile할 수 없음.

Verification: worker contract 기록, allowed path와 stop condition review, evidence ledger entry에 locator와 scan range 포함, conflict reconcile, generated evidence를 review 전 durable memory에서 제외, final handoff에 accepted finding, skipped check, residual risk, next action 명시.
