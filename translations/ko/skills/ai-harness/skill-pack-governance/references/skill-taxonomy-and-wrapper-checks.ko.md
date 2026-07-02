# Skill Taxonomy And Wrapper Checks

Reusable skill을 추가, 이동, rename, wrap, review할 때 사용합니다.

## Classification

- Technology stack이 아니라 problem capability에서 시작합니다.
- Java, PHP, React, Postgres, cloud provider, framework, vendor detail에는 stack profile 또는 reference를 사용합니다.
- 새 category는 기존 category가 맞지 않고 그 안에 둘 durable skill이 여럿 있을 때만 만듭니다.
- Legacy skill은 모든 오래된 stack detail이 아니라 compatibility와 hidden coupling에 집중합니다.

## Skill Body Checks

- Frontmatter에는 `name`과 `description`만 둡니다.
- Description은 `Use when...`으로 시작하고 trigger condition을 설명합니다.
- `SKILL.md`는 concise하게 유지합니다. Trigger, workflow, reference routing, 필요 시 stop condition만 둡니다.
- Reference에는 긴 checklist, example, provider detail, stack specific을 둡니다.

## Wrapper Checks

- Compatibility wrapper는 primary skill을 가리키고 stack detail은 reference에 둡니다.
- Wrapper name은 기존 trigger name이 유용할 때만 유지합니다.
- Wrapper는 primary skill의 full workflow를 복제하지 않습니다.
- Catalog validation은 duplicate name, missing primary route, missing reference, category drift를 잡아야 합니다.

## Stop Conditions

- 제안 skill이 distinct work capability 없이 vendor 또는 stack name에 그칩니다.
- Skill body가 reference로 라우팅하지 않고 긴 manual이 됩니다.
- Wrapper가 staged compatibility plan 없이 기존 trigger name을 깨뜨립니다.
- Docs, translations, tests, installed-copy expectation이 함께 갱신되지 않았습니다.
