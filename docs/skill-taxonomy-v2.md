# Skill Taxonomy v2

Skill taxonomy v2 uses capability categories as the primary axis. Stack-specific details move into references or profiles.

## Categories

- `foundation`: repo onboarding, bootstrap, and project docs.
- `delivery`: planning, verification, git, PR, and worklog flows.
- `architecture`: FSD, layered architecture, DDD, monorepos, and boundary review.
- `frontend`: UI, state, data, accessibility, performance, and visual QA.
- `backend`: API contracts, auth, server-rendered flows, workers, and integrations.
- `database`: schema change, migration, SQL, reporting, and data integrity.
- `devops`: CI/CD, containers, deployment, configuration, and observability.
- `security`: secrets, threat modeling, authorization, and dependency risk.
- `mobile`: Expo, React Native, native app, WebView bridge, and device QA.
- `data`: analytics, pipelines, ETL, dashboards, and data quality.
- `ai-harness`: MCP, skills, agents, context engineering, cache, and index design.
- `legacy`: legacy change safety and compatibility strategy.

## Wrapper Policy

Stack-named skills can remain as compatibility wrappers when they still provide useful trigger names. The wrapper should point to a primary capability skill and keep stack details in `references/`.

For example, `legacy-java-spring-mvc` routes to backend server-rendered change work and keeps Spring MVC specifics in its reference file.

## Backend And Security Pack

Backend and security skills use capability-first names:

- `backend/api-contract-boundary`: API and DTO boundary work.
- `backend/backend-change-safety`: services, modules, jobs, workers, queues, config, and integrations.
- `backend/server-rendered-change`: controllers, templates, sessions, forms, redirects, and server-rendered view contracts.
- `security/auth-access-control`: authentication, authorization, RBAC, tenants, scopes, and object-level access.
- `security/dependency-supply-chain-review`: dependencies, lockfiles, SBOMs, licenses, provenance, containers, and CVEs.
- `security/security-review`: broad security risk review and threat-model triage.

Stack profiles belong under the relevant primary skill reference tree. For backend change safety, Java, Kotlin, Go, Python, Node, .NET, and PHP details live under `skills/backend/backend-change-safety/references/stacks/` instead of creating stack-first primary skills.

## DevOps And Release Pack

DevOps skills use operational capability names rather than cloud-provider or orchestrator names:

- `devops/ci-failure-triage`: CI jobs, build pipelines, deployment checks, flaky tests, environment drift, and release automation failures.
- `devops/container-change-safety`: Dockerfiles, container images, Compose/Kubernetes manifests, service runtime config, healthchecks, volumes, networks, and containerized deployment behavior.
- `devops/deployment-release-check`: release readiness, deploys, rollbacks, feature flags, changelogs, artifacts, migration gates, and post-deploy checks.
- `devops/observability-incident-triage`: active incidents, production errors, alerts, latency, error rates, queue backlogs, job failures, logs, metrics, traces, and post-incident runbooks.

Provider-specific details belong in references or project playbooks. The primary skills should still work for containers, virtual machines, managed platforms, serverless, and simple script-based deployments.

## Validation

The catalog command reports duplicate skill names, wrapper routing gaps, missing wrapper references, and category drift:

```bash
ai-playbook catalog check --json
```
