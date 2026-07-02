# Package Release Readiness

Inputs: package 또는 artifact scope, package manager, registry 또는 distribution channel, version source, generated output, license/notice need, rollback 또는 unpublish constraint.

Outputs: package release checklist, artifact dry-run evidence, license/notice note, dependency/supply-chain note, verification 및 rollback handoff.

Skills: package publish readiness, dependency supply chain review, license notice review, package가 deploy 일부일 때 deployment release check, test verification strategy.

Tools: `dependency-inventory`, `diagnostics check`, `workflow run-preview`, `write-gate preview`, project가 정의한 package dry-run 또는 pack command.

Stop conditions: version source 불명확, artifact owner 누락, registry credential 필요하지만 사용 불가, license/notice evidence 누락, stale generated output, rollback 또는 unpublish path 불명확.

Verification: package dry-run file list, build 또는 pack command, metadata 및 entrypoint check, license/notice inclusion, lockfile 또는 dependency scan evidence, affected runtime path test.

