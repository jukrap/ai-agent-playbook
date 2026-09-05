# 스킬 전수 판정표

기준선의 각 스킬에 판정, 참조 보존 위치, 복구 경로를 지정합니다. bytes는 텍스트 크기이며 토큰이나 실측 실행 비용이 아닙니다. 참조 라이브러리는 해당 과제에 필요할 때만 읽습니다.

| 기존 스킬 | 판정 | 선택 진입점 | 선택 참조 보존 위치 | 스킬 / 참조 bytes |
| --- | --- | --- | --- | --- |
| agent-orchestration-handoff | 통합 | spec-artifacts | references/ai-harness/agent-orchestration-handoff | 1397 / 4684 |
| capability-witness-history | 통합 | project-memory | references/ai-harness/capability-witness-history | 1048 / 4723 |
| context-engineering-memory-design | 통합 | project-memory | references/ai-harness/context-engineering-memory-design | 1179 / 3494 |
| evidence-locator-integrity | 통합 | project-memory | references/ai-harness/evidence-locator-integrity | 1458 / 6173 |
| forge-automation-control | 진입점 제거 | 없음 | references/ai-harness/forge-automation-control | 3291 / 21407 |
| mcp-server-design | 진입점 제거 | 없음 | references/ai-harness/mcp-server-design | 923 / 3927 |
| pre-action-fact-gate | 진입점 제거 | 없음 | references/ai-harness/pre-action-fact-gate | 1178 / 4916 |
| runtime-index-cache-design | 통합 | project-memory | references/ai-harness/runtime-index-cache-design | 1102 / 2916 |
| skill-pack-governance | 진입점 제거 | 없음 | references/ai-harness/skill-pack-governance | 1117 / 3026 |
| boundary-review | 진입점 제거 | 없음 | references/architecture/boundary-review | 1341 / 10530 |
| domain-model-change | 진입점 제거 | 없음 | references/architecture/domain-model-change | 1170 / 2841 |
| feature-slice-boundary | 진입점 제거 | 없음 | references/architecture/feature-slice-boundary | 991 / 2808 |
| monorepo-package-boundary | 진입점 제거 | 없음 | references/architecture/monorepo-package-boundary | 1117 / 2753 |
| api-contract-boundary | 진입점 제거 | 없음 | references/backend/api-contract-boundary | 907 / 984 |
| backend-change-safety | 진입점 제거 | 없음 | references/backend/backend-change-safety | 2056 / 23947 |
| connector-integration-change | 진입점 제거 | 없음 | references/backend/connector-integration-change | 1316 / 6111 |
| job-worker-reliability | 진입점 제거 | 없음 | references/backend/job-worker-reliability | 1205 / 3205 |
| request-validation-error-contract | 진입점 제거 | 없음 | references/backend/request-validation-error-contract | 1179 / 2752 |
| server-rendered-change | 진입점 제거 | 없음 | references/backend/server-rendered-change | 1015 / 3128 |
| analytics-instrumentation-review | 진입점 제거 | 없음 | references/data/analytics-instrumentation-review | 1191 / 2472 |
| analytics-reporting-review | 진입점 제거 | 없음 | references/data/analytics-reporting-review | 1031 / 3406 |
| data-contract-lineage-review | 진입점 제거 | 없음 | references/data/data-contract-lineage-review | 1064 / 2577 |
| data-migration-integrity | 진입점 제거 | 없음 | references/data/data-migration-integrity | 1127 / 3273 |
| data-pipeline-review | 진입점 제거 | 없음 | references/data/data-pipeline-review | 943 / 3091 |
| data-quality-observability | 진입점 제거 | 없음 | references/data/data-quality-observability | 1110 / 2478 |
| knowledge-retrieval-pipeline-review | 진입점 제거 | 없음 | references/data/knowledge-retrieval-pipeline-review | 1263 / 2494 |
| knowledge-source-registry | 통합 | project-memory | references/data/knowledge-source-registry | 1106 / 5063 |
| data-integrity-constraints | 진입점 제거 | 없음 | references/database/data-integrity-constraints | 1039 / 3236 |
| database-change-safety | 진입점 제거 | 없음 | references/database/database-change-safety | 904 / 3862 |
| query-performance-review | 진입점 제거 | 없음 | references/database/query-performance-review | 1192 / 3542 |
| schema-migration-plan | 진입점 제거 | 없음 | references/database/schema-migration-plan | 1120 / 3932 |
| ci-quality-gate | 진입점 제거 | 없음 | references/delivery/ci-quality-gate | 1123 / 3902 |
| eval-harness-design | 통합 | spec-artifacts | references/delivery/eval-harness-design | 987 / 5823 |
| flaky-test-triage | 진입점 제거 | 없음 | references/delivery/flaky-test-triage | 974 / 2261 |
| git-worklog-guardrails | 통합 | spec-artifacts | references/delivery/git-worklog-guardrails | 839 / 1835 |
| test-fixture-data-design | 진입점 제거 | 없음 | references/delivery/test-fixture-data-design | 1033 / 1865 |
| test-verification-strategy | 진입점 제거 | 없음 | references/delivery/test-verification-strategy | 1032 / 2545 |
| brand-identity-system | 통합 | design-brief-direction | references/design/brand-identity-system | 1176 / 4283 |
| design-brief-direction | 유지·경량화 | design-brief-direction | references/design/design-brief-direction | 1462 / 9963 |
| design-reference-analysis | 통합 | design-brief-direction | references/design/design-reference-analysis | 1341 / 6281 |
| image-to-code-handoff | 통합 | design-brief-direction | references/design/image-to-code-handoff | 1179 / 3603 |
| ci-failure-triage | 진입점 제거 | 없음 | references/devops/ci-failure-triage | 748 / 1946 |
| container-change-safety | 진입점 제거 | 없음 | references/devops/container-change-safety | 1080 / 3926 |
| deployment-release-check | 진입점 제거 | 없음 | references/devops/deployment-release-check | 1410 / 8939 |
| observability-incident-triage | 진입점 제거 | 없음 | references/devops/observability-incident-triage | 1020 / 3014 |
| package-publish-readiness | 진입점 제거 | 없음 | references/devops/package-publish-readiness | 1058 / 2877 |
| browser-dom-change | 통합 | legacy-contracts | references/frontend/browser-dom-change | 899 / 1710 |
| design-system-handoff | 통합 | design-brief-direction | references/frontend/design-system-handoff | 1183 / 2804 |
| frontend-accessibility-review | 통합 | ui-polish | references/frontend/frontend-accessibility-review | 1104 / 3688 |
| frontend-state-data-flow | 진입점 제거 | 없음 | references/frontend/frontend-state-data-flow | 1046 / 3894 |
| generic-ui-review | 통합 | ui-polish | references/frontend/generic-ui-review | 1940 / 2961 |
| interactive-media-3d-review | 진입점 제거 | 없음 | references/frontend/interactive-media-3d-review | 1635 / 10589 |
| style-policy-selection | 통합 | ui-polish | references/frontend/style-policy-selection | 1100 / 1629 |
| ui-polish | 유지·경량화 | ui-polish | references/frontend/ui-polish | 935 / 3310 |
| visual-regression-qa | 통합 | ui-polish | references/frontend/visual-regression-qa | 1226 / 5441 |
| commit-worklog-guardrails | 통합 | spec-artifacts | references/git/commit-worklog-guardrails | 1083 / 7507 |
| legacy-android-webview-hybrid | 통합 | legacy-contracts | references/legacy/legacy-android-webview-hybrid | 1253 / 1784 |
| legacy-batch-file-transfer | 통합 | legacy-contracts | references/legacy/legacy-batch-file-transfer | 1169 / 1613 |
| legacy-change-safety | 통합 | legacy-contracts | references/legacy/legacy-change-safety | 895 / 4017 |
| legacy-database-heavy-system | 통합 | legacy-contracts | references/legacy/legacy-database-heavy-system | 1235 / 1805 |
| legacy-dotnet-webforms | 통합 | legacy-contracts | references/legacy/legacy-dotnet-webforms | 1474 / 1726 |
| legacy-feature-addition | 통합 | legacy-contracts | references/legacy/legacy-feature-addition | 1237 / 1749 |
| legacy-general | 통합 | legacy-contracts | references/legacy/legacy-general | 1220 / 1950 |
| legacy-ie-activex-compat | 통합 | legacy-contracts | references/legacy/legacy-ie-activex-compat | 1210 / 1802 |
| legacy-java-spring-mvc | 통합 | legacy-contracts | references/legacy/legacy-java-spring-mvc | 1438 / 1812 |
| legacy-jquery-web | 통합 | legacy-contracts | references/legacy/legacy-jquery-web | 1073 / 1738 |
| legacy-php-lamp | 통합 | legacy-contracts | references/legacy/legacy-php-lamp | 1462 / 1727 |
| legacy-reporting-printing | 통합 | legacy-contracts | references/legacy/legacy-reporting-printing | 1224 / 1489 |
| legacy-risk-check | 통합 | legacy-contracts | references/legacy/legacy-risk-check | 1217 / 1862 |
| legacy-server-rendered-web | 통합 | legacy-contracts | references/legacy/legacy-server-rendered-web | 1215 / 1517 |
| agent-skill-authoring | 진입점 제거 | 없음 | references/meta/agent-skill-authoring | 1979 / 3462 |
| device-permission-qa | 진입점 제거 | 없음 | references/mobile/device-permission-qa | 1145 / 3116 |
| native-release-readiness | 진입점 제거 | 없음 | references/mobile/native-release-readiness | 1211 / 3484 |
| offline-sync-review | 진입점 제거 | 없음 | references/mobile/offline-sync-review | 1166 / 2943 |
| webview-bridge | 통합 | legacy-contracts | references/mobile/webview-bridge | 897 / 1706 |
| adr-spec-handoff | 통합 | spec-artifacts | references/project/adr-spec-handoff | 1055 / 3337 |
| documentation-artifact-package | 통합 | spec-artifacts | references/project/documentation-artifact-package | 1237 / 3509 |
| issue-planning-triage | 통합 | spec-artifacts | references/project/issue-planning-triage | 1183 / 3547 |
| natural-writing-humanization | 유지·경량화 | natural-writing-humanization | references/project/natural-writing-humanization | 1994 / 8826 |
| project-bootstrap | 통합 | project-memory | references/project/project-bootstrap | 1256 / 2950 |
| project-doc-system | 통합 | project-memory | references/project/project-doc-system | 1056 / 2954 |
| release-notes-changelog | 통합 | spec-artifacts | references/project/release-notes-changelog | 1211 / 3420 |
| repo-onboarding | 통합 | project-memory | references/project/repo-onboarding | 1090 / 1317 |
| requirements-prd-scope-review | 통합 | spec-artifacts | references/project/requirements-prd-scope-review | 1171 / 3746 |
| cleanup-ai-slop | 진입점 제거 | 없음 | references/quality/cleanup-ai-slop | 1193 / 1924 |
| frontend-ui-polish | 통합 | ui-polish | references/quality/frontend-ui-polish | 1027 / 2009 |
| review-work-light | 진입점 제거 | 없음 | references/quality/review-work-light | 941 / 1573 |
| style-quality-review | 통합 | ui-polish | references/quality/style-quality-review | 963 / 941 |
| ui-style-policy | 통합 | ui-polish | references/quality/ui-style-policy | 919 / 1553 |
| auth-access-control | 진입점 제거 | 없음 | references/security/auth-access-control | 839 / 2418 |
| dependency-supply-chain-review | 진입점 제거 | 없음 | references/security/dependency-supply-chain-review | 1157 / 5443 |
| license-notice-review | 진입점 제거 | 없음 | references/security/license-notice-review | 1031 / 2571 |
| security-compliance-gate | 진입점 제거 | 없음 | references/security/security-compliance-gate | 1235 / 5638 |
| security-review | 진입점 제거 | 없음 | references/security/security-review | 1254 / 11853 |

기록·문서 규격에는 재사용 필드를, 디자인·UI에는 제품별 기준과 예시를 남깁니다. 일반 사고 지침과 스킬 간 반복 호출만으로 별도 기본 진입점을 유지하지 않습니다. 코드 정리는 별도의 선택 참조로 보존합니다. 항목별 이유·참조 목록·프로필·비용 측정 한계는 skill-decisions.json에 기록합니다.

모든 항목의 복구는 소스 기준선을 확인하거나 고정 ai-agent-playbook@0.5.11을 명시적으로 실행하는 방식입니다. 구버전 런타임을 자동 실행하지 않습니다.
