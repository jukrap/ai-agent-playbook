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

## Validation

The catalog command reports duplicate skill names, wrapper routing gaps, missing wrapper references, and category drift:

```bash
ai-playbook catalog check --json
```

