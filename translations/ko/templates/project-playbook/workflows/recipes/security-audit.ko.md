# Security Audit

Inputs: scope, threat model, auth boundaries, secrets policy, dependency surface.

Outputs: findings, risk level, remediation plan, verification notes.

Skills: security review, API contract boundary, data access가 관련되면 database change safety.

Tools: `operator search`, `operator map`, `write-gate preview`, 사용 가능한 package manager audit tool.

Stop conditions: scope 누락, production credential 필요, 불명확한 authorization owner.

Verification: targeted exploit/regression check와 사용 가능한 dependency/security scanner output.

