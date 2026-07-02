# Package Release Readiness

Inputs: package or artifact scope, package manager, registry or distribution channel, version source, generated output, license/notice needs, rollback or unpublish constraints.

Outputs: package release checklist, artifact dry-run evidence, license/notice notes, dependency/supply-chain notes, verification and rollback handoff.

Skills: package publish readiness, dependency supply chain review, license notice review, deployment release check when the package is part of a deploy, test verification strategy.

Tools: `dependency-inventory`, `diagnostics check`, `workflow run-preview`, `write-gate preview`, package dry-run or pack commands when the project defines them.

Stop conditions: unclear version source, missing artifact owner, registry credentials required but unavailable, missing license/notice evidence, stale generated output, unknown rollback or unpublish path.

Verification: package dry-run file list, build or pack command, metadata and entrypoint check, license/notice inclusion, lockfile or dependency scan evidence, tests for affected runtime paths.

