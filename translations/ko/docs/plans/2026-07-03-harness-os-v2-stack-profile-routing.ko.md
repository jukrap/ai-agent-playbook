# AI Agent Playbook v2 Stack Profile Routing 구현 계획

> **Agentic worker용:** REQUIRED SUB-SKILL: 이 계획을 task 단위로 구현할 때는 superpowers:executing-plans를 사용합니다. 단계 추적은 checkbox(`- [ ]`) 문법을 사용합니다.

**Goal:** Stack-specific backend guidance를 capability skill의 보조 위치로 명확히 내려, stack-named legacy skill이 primary procedure가 아니라 routing wrapper로 작동하게 합니다.

**Architecture:** 기존 capability taxonomy를 유지합니다. Stack profile selection용 backend reference 1개를 추가하고, wrapper/docs를 업데이트해 service, config, persistence, integration concern이 `backend-change-safety`와 선택된 `references/stacks/*` profile로 라우팅되게 합니다.

**Tech Stack:** Korean translations가 있는 Markdown skills/references/docs, existing skill validation scripts.

---

## Current Baseline

- `backend-change-safety`에는 이미 Java, Kotlin, Go, Python, Node, .NET, PHP stack profile이 있습니다.
- `legacy-java-spring-mvc`, `legacy-php-lamp`, `legacy-dotnet-webforms` 같은 legacy stack skill은 아직 stack-specific primary workflow처럼 읽히는 부분이 있습니다.
- Wrapper policy는 stack detail이 reference에 있어야 한다고 말하지만, reader에게 server-rendered flow guidance와 backend stack profile 중 무엇을 언제 읽을지 더 분명한 decision rule이 필요합니다.

## Tasks

### Task 1: Profile Selection Reference 추가

- [ ] `skills/backend/backend-change-safety/references/stack-profile-selection.md`를 만듭니다.
- [ ] Java, Kotlin, Node, Python, Go, .NET, PHP profile을 선택하는 evidence를 정의합니다.
- [ ] Profile을 `server-rendered-change`, `database-change-safety`, `connector-integration-change`, security skill과 함께 쓸 때를 정의합니다.
- [ ] 한국어 번역을 추가합니다.

### Task 2: Primary Skill Routing 갱신

- [ ] `skills/backend/backend-change-safety/SKILL.md`에 selection reference를 언급합니다.
- [ ] `translations/ko/skills/backend/backend-change-safety.ko.md`를 업데이트합니다.
- [ ] `SKILL.md`를 간결하게 유지하고 stack detail을 skill body로 옮기지 않습니다.

### Task 3: Legacy Stack Wrapper 갱신

- [ ] Java Spring MVC, PHP LAMP, .NET Web Forms wrapper skill에 server-rendered flow는 `backend/server-rendered-change`로, service/config/persistence concern은 `backend/backend-change-safety`와 stack profile로 라우팅한다고 명시합니다.
- [ ] 대응하는 한국어 번역을 업데이트합니다.
- [ ] Compatibility wrapper name은 제거하지 않습니다.

### Task 4: Public Taxonomy Docs 갱신

- [ ] `docs/skill-taxonomy-v2.md`와 한국어 번역에 stack profile selection rule을 반영합니다.
- [ ] Backend map wording이 더 명확해야 하면 `docs/classification.md`와 한국어 번역을 업데이트합니다.
- [ ] Reference project name이나 raw upstream excerpt를 복사하지 않습니다.

### Task 5: Validate And Commit

- [ ] `.\scripts\validate-skills.ps1`를 실행합니다.
- [ ] `.\scripts\validate-translations.ps1`를 실행합니다.
- [ ] `.\scripts\validate-public-docs.ps1`를 실행합니다.
- [ ] `node bin\aapb.mjs catalog check --json`을 실행합니다.
- [ ] `git diff --check`를 실행합니다.
- [ ] 명시 파일만 stage하고 staged diff를 확인한 뒤 commit합니다.
