# Skill disposition table

Each baseline skill has a disposition, a destination for its reference material, and a recovery path. Byte counts describe text size, not tokens or measured execution cost. The reference library is read only when a task needs it.

| Baseline skill | Decision | Selected entrypoint | Optional reference destination | Skill / reference bytes |
| --- | --- | --- | --- | --- |
| agent-orchestration-handoff | merge | spec-artifacts | references/ai-harness/agent-orchestration-handoff | 1397 / 4684 |
| capability-witness-history | merge | project-memory | references/ai-harness/capability-witness-history | 1048 / 4723 |
| context-engineering-memory-design | merge | project-memory | references/ai-harness/context-engineering-memory-design | 1179 / 3494 |
| evidence-locator-integrity | merge | project-memory | references/ai-harness/evidence-locator-integrity | 1458 / 6173 |
| forge-automation-control | retire-entrypoint | none | references/ai-harness/forge-automation-control | 3291 / 21407 |
| mcp-server-design | retire-entrypoint | none | references/ai-harness/mcp-server-design | 923 / 3927 |
| pre-action-fact-gate | retire-entrypoint | none | references/ai-harness/pre-action-fact-gate | 1178 / 4916 |
| runtime-index-cache-design | merge | project-memory | references/ai-harness/runtime-index-cache-design | 1102 / 2916 |
| skill-pack-governance | retire-entrypoint | none | references/ai-harness/skill-pack-governance | 1117 / 3026 |
| boundary-review | retire-entrypoint | none | references/architecture/boundary-review | 1341 / 10530 |
| domain-model-change | retire-entrypoint | none | references/architecture/domain-model-change | 1170 / 2841 |
| feature-slice-boundary | retire-entrypoint | none | references/architecture/feature-slice-boundary | 991 / 2808 |
| monorepo-package-boundary | retire-entrypoint | none | references/architecture/monorepo-package-boundary | 1117 / 2753 |
| api-contract-boundary | retire-entrypoint | none | references/backend/api-contract-boundary | 907 / 984 |
| backend-change-safety | retire-entrypoint | none | references/backend/backend-change-safety | 2056 / 23947 |
| connector-integration-change | retire-entrypoint | none | references/backend/connector-integration-change | 1316 / 6111 |
| job-worker-reliability | retire-entrypoint | none | references/backend/job-worker-reliability | 1205 / 3205 |
| request-validation-error-contract | retire-entrypoint | none | references/backend/request-validation-error-contract | 1179 / 2752 |
| server-rendered-change | retire-entrypoint | none | references/backend/server-rendered-change | 1015 / 3128 |
| analytics-instrumentation-review | retire-entrypoint | none | references/data/analytics-instrumentation-review | 1191 / 2472 |
| analytics-reporting-review | retire-entrypoint | none | references/data/analytics-reporting-review | 1031 / 3406 |
| data-contract-lineage-review | retire-entrypoint | none | references/data/data-contract-lineage-review | 1064 / 2577 |
| data-migration-integrity | retire-entrypoint | none | references/data/data-migration-integrity | 1127 / 3273 |
| data-pipeline-review | retire-entrypoint | none | references/data/data-pipeline-review | 943 / 3091 |
| data-quality-observability | retire-entrypoint | none | references/data/data-quality-observability | 1110 / 2478 |
| knowledge-retrieval-pipeline-review | retire-entrypoint | none | references/data/knowledge-retrieval-pipeline-review | 1263 / 2494 |
| knowledge-source-registry | merge | project-memory | references/data/knowledge-source-registry | 1106 / 5063 |
| data-integrity-constraints | retire-entrypoint | none | references/database/data-integrity-constraints | 1039 / 3236 |
| database-change-safety | retire-entrypoint | none | references/database/database-change-safety | 904 / 3862 |
| query-performance-review | retire-entrypoint | none | references/database/query-performance-review | 1192 / 3542 |
| schema-migration-plan | retire-entrypoint | none | references/database/schema-migration-plan | 1120 / 3932 |
| ci-quality-gate | retire-entrypoint | none | references/delivery/ci-quality-gate | 1123 / 3902 |
| eval-harness-design | merge | spec-artifacts | references/delivery/eval-harness-design | 987 / 5823 |
| flaky-test-triage | retire-entrypoint | none | references/delivery/flaky-test-triage | 974 / 2261 |
| git-worklog-guardrails | merge | spec-artifacts | references/delivery/git-worklog-guardrails | 839 / 1835 |
| test-fixture-data-design | retire-entrypoint | none | references/delivery/test-fixture-data-design | 1033 / 1865 |
| test-verification-strategy | retire-entrypoint | none | references/delivery/test-verification-strategy | 1032 / 2545 |
| brand-identity-system | merge | design-brief-direction | references/design/brand-identity-system | 1176 / 4283 |
| design-brief-direction | retain-and-shorten | design-brief-direction | references/design/design-brief-direction | 1462 / 9963 |
| design-reference-analysis | merge | design-brief-direction | references/design/design-reference-analysis | 1341 / 6281 |
| image-to-code-handoff | merge | design-brief-direction | references/design/image-to-code-handoff | 1179 / 3603 |
| ci-failure-triage | retire-entrypoint | none | references/devops/ci-failure-triage | 748 / 1946 |
| container-change-safety | retire-entrypoint | none | references/devops/container-change-safety | 1080 / 3926 |
| deployment-release-check | retire-entrypoint | none | references/devops/deployment-release-check | 1410 / 8939 |
| observability-incident-triage | retire-entrypoint | none | references/devops/observability-incident-triage | 1020 / 3014 |
| package-publish-readiness | retire-entrypoint | none | references/devops/package-publish-readiness | 1058 / 2877 |
| browser-dom-change | merge | legacy-contracts | references/frontend/browser-dom-change | 899 / 1710 |
| design-system-handoff | merge | design-brief-direction | references/frontend/design-system-handoff | 1183 / 2804 |
| frontend-accessibility-review | merge | ui-polish | references/frontend/frontend-accessibility-review | 1104 / 3688 |
| frontend-state-data-flow | retire-entrypoint | none | references/frontend/frontend-state-data-flow | 1046 / 3894 |
| generic-ui-review | merge | ui-polish | references/frontend/generic-ui-review | 1940 / 2961 |
| interactive-media-3d-review | retire-entrypoint | none | references/frontend/interactive-media-3d-review | 1635 / 10589 |
| style-policy-selection | merge | ui-polish | references/frontend/style-policy-selection | 1100 / 1629 |
| ui-polish | retain-and-shorten | ui-polish | references/frontend/ui-polish | 935 / 3310 |
| visual-regression-qa | merge | ui-polish | references/frontend/visual-regression-qa | 1226 / 5441 |
| commit-worklog-guardrails | merge | spec-artifacts | references/git/commit-worklog-guardrails | 1083 / 7507 |
| legacy-android-webview-hybrid | merge | legacy-contracts | references/legacy/legacy-android-webview-hybrid | 1253 / 1784 |
| legacy-batch-file-transfer | merge | legacy-contracts | references/legacy/legacy-batch-file-transfer | 1169 / 1613 |
| legacy-change-safety | merge | legacy-contracts | references/legacy/legacy-change-safety | 895 / 4017 |
| legacy-database-heavy-system | merge | legacy-contracts | references/legacy/legacy-database-heavy-system | 1235 / 1805 |
| legacy-dotnet-webforms | merge | legacy-contracts | references/legacy/legacy-dotnet-webforms | 1474 / 1726 |
| legacy-feature-addition | merge | legacy-contracts | references/legacy/legacy-feature-addition | 1237 / 1749 |
| legacy-general | merge | legacy-contracts | references/legacy/legacy-general | 1220 / 1950 |
| legacy-ie-activex-compat | merge | legacy-contracts | references/legacy/legacy-ie-activex-compat | 1210 / 1802 |
| legacy-java-spring-mvc | merge | legacy-contracts | references/legacy/legacy-java-spring-mvc | 1438 / 1812 |
| legacy-jquery-web | merge | legacy-contracts | references/legacy/legacy-jquery-web | 1073 / 1738 |
| legacy-php-lamp | merge | legacy-contracts | references/legacy/legacy-php-lamp | 1462 / 1727 |
| legacy-reporting-printing | merge | legacy-contracts | references/legacy/legacy-reporting-printing | 1224 / 1489 |
| legacy-risk-check | merge | legacy-contracts | references/legacy/legacy-risk-check | 1217 / 1862 |
| legacy-server-rendered-web | merge | legacy-contracts | references/legacy/legacy-server-rendered-web | 1215 / 1517 |
| agent-skill-authoring | retire-entrypoint | none | references/meta/agent-skill-authoring | 1979 / 3462 |
| device-permission-qa | retire-entrypoint | none | references/mobile/device-permission-qa | 1145 / 3116 |
| native-release-readiness | retire-entrypoint | none | references/mobile/native-release-readiness | 1211 / 3484 |
| offline-sync-review | retire-entrypoint | none | references/mobile/offline-sync-review | 1166 / 2943 |
| webview-bridge | merge | legacy-contracts | references/mobile/webview-bridge | 897 / 1706 |
| adr-spec-handoff | merge | spec-artifacts | references/project/adr-spec-handoff | 1055 / 3337 |
| documentation-artifact-package | merge | spec-artifacts | references/project/documentation-artifact-package | 1237 / 3509 |
| issue-planning-triage | merge | spec-artifacts | references/project/issue-planning-triage | 1183 / 3547 |
| natural-writing-humanization | retain-and-shorten | natural-writing-humanization | references/project/natural-writing-humanization | 1994 / 8826 |
| project-bootstrap | merge | project-memory | references/project/project-bootstrap | 1256 / 2950 |
| project-doc-system | merge | project-memory | references/project/project-doc-system | 1056 / 2954 |
| release-notes-changelog | merge | spec-artifacts | references/project/release-notes-changelog | 1211 / 3420 |
| repo-onboarding | merge | project-memory | references/project/repo-onboarding | 1090 / 1317 |
| requirements-prd-scope-review | merge | spec-artifacts | references/project/requirements-prd-scope-review | 1171 / 3746 |
| cleanup-ai-slop | retire-entrypoint | none | references/quality/cleanup-ai-slop | 1193 / 1924 |
| frontend-ui-polish | merge | ui-polish | references/quality/frontend-ui-polish | 1027 / 2009 |
| review-work-light | retire-entrypoint | none | references/quality/review-work-light | 941 / 1573 |
| style-quality-review | merge | ui-polish | references/quality/style-quality-review | 963 / 941 |
| ui-style-policy | merge | ui-polish | references/quality/ui-style-policy | 919 / 1553 |
| auth-access-control | retire-entrypoint | none | references/security/auth-access-control | 839 / 2418 |
| dependency-supply-chain-review | retire-entrypoint | none | references/security/dependency-supply-chain-review | 1157 / 5443 |
| license-notice-review | retire-entrypoint | none | references/security/license-notice-review | 1031 / 2571 |
| security-compliance-gate | retire-entrypoint | none | references/security/security-compliance-gate | 1235 / 5638 |
| security-review | retire-entrypoint | none | references/security/security-review | 1254 / 11853 |

Record and document-format entries retain reusable fields; design/UI entries retain product-specific criteria and examples. General reasoning and repeated cross-skill routing do not justify separate default entrypoints. Code cleanup remains a distinct, optional reference. See skill-decisions.json for each reason, reference list, profile, and cost limitation.

Recovery for every row: inspect the source baseline or explicitly run the pinned ai-agent-playbook@0.5.11 package. Nothing automatically executes the old runtime.
