# Architecture Boundary Review

Inputs: affected module, intended architecture style, dependency direction, public API, domain concept, workspace package, migration 또는 compatibility constraint.

Outputs: boundary review note, affected module/package map, coupling risk, compatibility 또는 migration plan, architecture decision, verification checklist.

Skills: boundary review, feature slice boundary, domain model change, monorepo package boundary, API contract boundary when contracts change, test verification strategy.

Tools: `operator map`, `operator search`, `symbol outline`, `dependency inventory`, `write-gate preview`, project architecture docs.

Stop conditions: architecture style을 folder name에서 추정함, public API caller가 불명확함, domain invariant owner가 불명확함, dependency cycle impact가 불명확함, broad restructure에 migration plan이 없음.

Verification: dependency direction check, caller/import inventory, package build/typecheck/test selection, API 변경 시 contract test, architecture decision 또는 worklog update.
