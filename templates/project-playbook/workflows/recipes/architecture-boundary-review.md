# Architecture Boundary Review

Inputs: affected modules, intended architecture style, dependency direction, public APIs, domain concepts, workspace packages, and migration or compatibility constraints.

Outputs: boundary review notes, affected module/package map, coupling risks, compatibility or migration plan, architecture decisions, and verification checklist.

Skills: boundary review, feature slice boundary, domain model change, monorepo package boundary, API contract boundary when contracts change, test verification strategy.

Tools: `operator map`, `operator search`, `symbol outline`, `dependency inventory`, `write-gate preview`, project architecture docs.

Stop conditions: architecture style is assumed from folder names, public API callers are unknown, domain invariant owner is unclear, dependency cycle impact is unknown, or broad restructure lacks migration plan.

Verification: dependency direction check, caller/import inventory, package build/typecheck/test selection, contract tests when APIs change, and architecture decision or worklog update.
