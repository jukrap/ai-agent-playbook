# Legacy Change

Inputs: legacy subsystem, current behavior, requested change, rollback path.

Outputs: risk notes, compatibility checks, minimal change, worklog.

Skills: legacy change safety, backend or frontend primary skill, database change safety when data is involved.

Tools: `operator preflight`, `contracts check`, `write-gate preview`, `operator delta`.

Stop conditions: no reproducible baseline, hidden generated files, unclear production coupling.

Verification: preserve existing behavior first; add focused regression checks where practical.

