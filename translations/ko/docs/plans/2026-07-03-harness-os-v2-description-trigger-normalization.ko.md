# AI Agent Playbook v2 Description Trigger Normalization

**목표:** Skill discovery 정확도를 유지하면서 skill lint warning noise를 줄입니다.

**이유:** Depth metric을 추가한 뒤 `skills lint`에서는 shallow reference와 conflict가 없었지만, 대부분의 warning은 frontmatter description이 100자를 넘는다는 데서 나왔습니다. Description은 재사용 절차가 아니라 trigger sentence이므로 discovery value를 잃지 않는 선에서 간결해야 합니다.

**결정:** Description length warning threshold를 180자로 올리고, `workflow`는 instruction-like phrase에 포함된 경우가 아니면 workflow node나 workflow question 같은 domain term으로 허용합니다. 새 threshold를 넘는 description만 줄입니다.

## 범위

- 명시적인 description warning threshold constant를 추가합니다.
- Workflow node나 workflow question 같은 domain term false positive를 제거합니다.
- 180자를 넘는 description을 줄입니다.
- Skill body와 reference는 변경하지 않습니다.
- Maintenance docs와 Korean translation을 갱신합니다.
- 긴 workflow-oriented description에 대한 regression coverage를 유지합니다.

## 비목표

- Depth concern을 해결하려고 `SKILL.md` body를 길게 만들지 않습니다.
- Description을 최소화하려고 유용한 trigger term을 제거하지 않습니다.
- 모든 skill의 description 길이를 똑같이 맞추지 않습니다.
- Skill name, category, compatibility wrapper는 변경하지 않습니다.

## 구현 체크리스트

- [x] Plan과 Korean translation을 추가합니다.
- [x] Description length threshold를 조정합니다.
- [x] Workflow-oriented description detection을 좁힙니다.
- [x] 180자를 넘는 description을 줄입니다.
- [x] Maintenance docs와 translation을 갱신합니다.
- [x] Validation을 실행합니다.
- [x] 이 slice를 commit/push합니다.

## 검증

- `node bin/ai-playbook.mjs skills lint --json`
- `npm run check`
- `node --test test/skills-lifecycle.test.mjs`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- `.\scripts\sync-skills.ps1`
