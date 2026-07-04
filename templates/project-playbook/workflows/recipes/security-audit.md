# Security Audit

Inputs: scope, threat model, auth boundaries, secrets policy, dependency surface.

Outputs: findings, risk level, remediation plan, verification notes.

Skills: security review, API contract boundary, database change safety when data access is involved.

Tools: `operator search`, `operator map`, `write-gate preview`, package manager audit tools when available.

Stop conditions: missing scope, production credential requirement, unclear authorization owner.

Verification: targeted exploit/regression checks and dependency/security scanner output when available.

