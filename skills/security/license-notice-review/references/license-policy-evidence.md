# License Policy Evidence

Use this when license or redistribution questions affect a change.

## Evidence To Identify

- First-party license file, package metadata license field, contributor license policy, and repository publishing policy.
- Third-party direct and transitive dependencies, vendored code, generated artifacts, bundled assets, examples, templates, and copied snippets.
- Policy files: allow/deny lists, exception ledgers, notice templates, SBOM output, package scan output, and vulnerability/compliance waivers.
- Redistribution scope: internal tool, source package, binary, container image, mobile app, SaaS distribution, marketplace plugin, or documentation bundle.

## Review Rules

- Check the artifact that ships, not only the source tree.
- Keep license compatibility tied to repository policy; do not assume permissive from popularity or package age.
- Exceptions need owner, reason, affected artifact, expiry or revisit condition, and mitigation.
- Generated code and vendored assets still need provenance and license evidence when redistributed.

## Boundaries

- Do not provide legal approval or claim a license is acceptable without project policy.
- Do not paste full third-party license text into worklogs unless the project explicitly stores it there.
- Record unresolved questions as blockers or residual risk instead of smoothing them over.
