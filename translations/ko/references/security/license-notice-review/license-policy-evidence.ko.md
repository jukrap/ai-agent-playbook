# License Policy Evidence

License 또는 redistribution question이 변경에 영향을 줄 때 사용합니다.

## Evidence To Identify

- First-party license file, package metadata license field, contributor license policy, repository publishing policy.
- Third-party direct/transitive dependency, vendored code, generated artifact, bundled asset, example, template, copied snippet.
- Policy file: allow/deny list, exception ledger, notice template, SBOM output, package scan output, vulnerability/compliance waiver.
- Redistribution scope: internal tool, source package, binary, container image, mobile app, SaaS distribution, marketplace plugin, documentation bundle.

## Review Rules

- Source tree뿐 아니라 실제 ship되는 artifact를 확인합니다.
- License compatibility는 repository policy와 연결합니다. Package popularity나 age만으로 permissive하다고 가정하지 않습니다.
- Exception에는 owner, reason, affected artifact, expiry 또는 revisit condition, mitigation이 필요합니다.
- Generated code와 vendored asset도 redistribution될 때 provenance와 license evidence가 필요합니다.

## Boundaries

- Legal approval을 제공하거나 project policy 없이 license가 acceptable하다고 주장하지 않습니다.
- Project가 명시적으로 저장하는 곳이 아니라면 full third-party license text를 worklog에 붙여넣지 않습니다.
- Unresolved question은 뭉개지 말고 blocker 또는 residual risk로 기록합니다.
