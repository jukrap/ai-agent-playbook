# AI Agent Playbook v2 MCP Resource And Docs Hardening 계획

**목표:** 구조화된 MCP resource를 추가하고, `.ai-agent-playbook` 진입 안내를 강화하며, README/MCP 문서를 현재 구현과 맞춰 확장된 하네스를 AI 앱이 더 쉽게 발견하고 사용할 수 있게 합니다.

**지금 하는 이유:** 레퍼런스 채택 작업으로 design, security, backend, architecture, 3D, data, agent-harness 역량 pack은 이미 넓어졌습니다. 이제 약한 지점은 기능 개수 자체가 아니라 Codex App, Codex CLI, Claude Code, 그 외 MCP 지원 에이전트가 수정 전에 올바른 resource, skill, workflow, permission tier, project-memory 읽기 순서를 안정적으로 찾을 수 있는지입니다.

**아키텍처:** MCP는 기본적으로 read-only로 유지합니다. 안정적인 발견 패킷은 resource로, 재사용 리뷰 brief는 prompt로, 근거 수집은 read-only tool로, 제한된 `.ai-agent-playbook` 또는 runtime artifact 쓰기는 opt-in write tool로 둡니다. 프로젝트 소스 파일 쓰기는 MCP 밖에 둡니다.

## 범위

- Adapter 지원, playbook layout v2, MCP permission model을 위한 read-only MCP resource를 추가합니다.
- 새 resource가 목록에 보이고 structured JSON으로 읽히는지 MCP test를 갱신합니다.
- `.ai-agent-playbook` template entry file을 갱신해 에이전트가 `START_HERE.md`, `CURRENT.md`, questions, 관련 memory, contracts, maps, workflow recipe에서 시작하게 합니다.
- README와 command/permission 문서, 한국어 번역을 갱신합니다.
- noisy upstream source를 복사하지 않고 이어갈 수 있는 reference adoption follow-up을 기록합니다.

## 사용한 레퍼런스 신호

- 디자인 레퍼런스는 design direction, brand, reference analysis, Figma/image handoff, visual evidence boundary 강화가 필요하다는 신호를 줬습니다.
- 보안과 컴플라이언스 레퍼런스는 opt-in write boundary, source registry hygiene, credential handling, release gate 강화가 필요하다는 신호를 줬습니다.
- AI 하네스 레퍼런스는 resource/prompt/tool 분리, worker contract, memory boundary, cache/index surface, evidence ledger가 중요하다는 신호를 줬습니다.
- 백엔드와 아키텍처 레퍼런스는 스택명 우선보다 capability-first routing이 맞다는 신호를 줬습니다.

## 작업

- [x] Codex, Codex App, Claude Code, MCP 설정 발견용 `ai-agent-playbook://adapters` 추가.
- [x] `.ai-agent-playbook` 읽기 순서와 runtime-vs-memory 규칙을 위한 `ai-agent-playbook://playbook-layout-v2` 추가.
- [x] 기본 resource, permission tier, opt-in write tool을 위한 `ai-agent-playbook://mcp-permission-model` 추가.
- [x] 새 resource용 MCP test 갱신.
- [x] `.ai-agent-playbook` `START_HERE.md`와 `SKILLS.md` template 갱신.
- [x] 한국어 template 번역 갱신.
- [x] README, MCP command docs, permission model docs 갱신.

## 후속 후보

- Target project에 source registry와 ledger가 있을 때 reference adoption status를 읽는 read-only MCP resource 추가.
- 사용자가 CLI 명령을 기억하지 않아도 `adapter check` 결과를 볼 수 있는 adapter readiness resource 추가.
- 한국어 README skill catalog가 더 길어지면 별도 한국어 skill catalog 문서로 분리.
- `src/mcp-tools.mjs`와 permission docs의 tool 목록이 어긋나지 않도록 documentation lint 추가.
- Fixture를 bootstrap한 뒤 `START_HERE.md`, `SKILLS.md`, workflow recipes, runtime, knowledge file이 서로 맞는지 보는 `.ai-agent-playbook` usage smoke test 추가.

## 검증

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
