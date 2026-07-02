# Skill Pack Governance

Taxonomy drift나 prompt noise 없이 skill pack을 확장하기 위한 primary AI harness skill입니다.

## Workflow

1. 제안된 guidance를 capability, workflow, stack profile, reference, template, adapter, runtime command, MCP surface로 분류합니다.
2. Primary skill은 capability-first로 유지하고 compatibility name과 stack-specific detail에는 wrapper 또는 reference를 사용합니다.
3. Trigger-focused guidance는 `SKILL.md`에 두고 긴 rule, example, provider detail, pitfall은 reference로 옮깁니다.
4. Docs, translations, catalog tests, validation scripts, install/sync expectation을 같은 변경에서 갱신합니다.

## Reference

Category, naming, wrapper, catalog validation check에는 `references/skill-taxonomy-and-wrapper-checks.md`를 읽습니다.

External reference를 reusable docs에 noise 없이 채택할 때는 `references/reference-adoption-noise-control.md`를 읽습니다.
