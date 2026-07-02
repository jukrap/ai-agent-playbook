# Skill Taxonomy v2

Skill taxonomy v2는 capability category를 1차 축으로 씁니다. 스택별 세부사항은 reference나 profile로 내립니다.

## Categories

- `foundation`: repo onboarding, bootstrap, project docs.
- `delivery`: planning, verification, git, PR, worklog flow.
- `architecture`: FSD, layered architecture, DDD, monorepo, boundary review.
- `frontend`: UI, state, data, accessibility, performance, visual QA.
- `backend`: API contract, auth, server-rendered flow, worker, integration.
- `database`: schema change, migration, SQL, reporting, data integrity.
- `devops`: CI/CD, container, deployment, configuration, observability.
- `security`: secret, threat modeling, authorization, dependency risk.
- `mobile`: Expo, React Native, native app, WebView bridge, device QA.
- `data`: analytics, pipeline, ETL, dashboard, data quality.
- `ai-harness`: MCP, skill, agent, context engineering, cache, index design.
- `legacy`: legacy change safety와 compatibility strategy.

## Wrapper Policy

스택명 스킬은 유용한 trigger name이면 compatibility wrapper로 남길 수 있습니다. Wrapper는 primary capability skill을 가리키고, 스택 세부사항은 `references/`에 둡니다.

예를 들어 `legacy-java-spring-mvc`는 backend server-rendered change 작업으로 라우팅하고 Spring MVC 세부사항은 reference 파일에 둡니다.

## Validation

Catalog 명령은 duplicate skill name, wrapper routing 누락, wrapper reference 누락, category drift를 보고합니다.

```bash
ai-playbook catalog check --json
```

