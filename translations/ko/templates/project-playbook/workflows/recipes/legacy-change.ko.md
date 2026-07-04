# Legacy Change

Inputs: legacy subsystem, current behavior, requested change, rollback path.

Outputs: risk notes, compatibility checks, minimal change, worklog.

Skills: legacy change safety, backend 또는 frontend primary skill, data가 관련되면 database change safety.

Tools: `operator preflight`, `contracts check`, `write-gate preview`, `operator delta`.

Stop conditions: 재현 가능한 baseline 없음, 숨은 generated file, 불명확한 production coupling.

Verification: 기존 동작 보존을 먼저 확인하고, 가능하면 focused regression check를 추가합니다.

