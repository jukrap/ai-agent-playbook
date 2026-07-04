# AI Agent Playbook v2 Stack Profile Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make stack-specific backend guidance clearly secondary to capability skills, so stack-named legacy skills act as routing wrappers instead of primary procedures.

**Architecture:** Keep the existing capability taxonomy. Add one backend reference for stack profile selection and update wrappers/docs to route service, config, persistence, and integration concerns through `backend-change-safety` with a selected `references/stacks/*` profile.

**Tech Stack:** Markdown skills/references/docs with Korean translations, existing skill validation scripts.

---

## Current Baseline

- `backend-change-safety` already has stack profiles for Java, Kotlin, Go, Python, Node, .NET, and PHP.
- Legacy stack skills such as `legacy-java-spring-mvc`, `legacy-php-lamp`, and `legacy-dotnet-webforms` still read like stack-specific primary workflows.
- The wrapper policy says stack details belong in references, but the reader needs a sharper decision rule for when to load server-rendered flow guidance versus backend stack profiles.

## Tasks

### Task 1: Add Profile Selection Reference

- [ ] Create `skills/backend/backend-change-safety/references/stack-profile-selection.md`.
- [ ] Define evidence for selecting Java, Kotlin, Node, Python, Go, .NET, or PHP profiles.
- [ ] Define when to pair profiles with `server-rendered-change`, `database-change-safety`, `connector-integration-change`, and security skills.
- [ ] Add the Korean translation.

### Task 2: Update Primary Skill Routing

- [ ] Update `skills/backend/backend-change-safety/SKILL.md` to mention the selection reference.
- [ ] Update `translations/ko/skills/backend/backend-change-safety.ko.md`.
- [ ] Keep `SKILL.md` concise and avoid moving stack details into the skill body.

### Task 3: Update Legacy Stack Wrappers

- [ ] Update Java Spring MVC, PHP LAMP, and .NET Web Forms wrapper skills to state that server-rendered flow routes through `backend/server-rendered-change`, while service/config/persistence concerns route through `backend/backend-change-safety` plus a stack profile.
- [ ] Update matching Korean translations.
- [ ] Do not remove compatibility wrapper names.

### Task 4: Update Public Taxonomy Docs

- [ ] Update `docs/skill-taxonomy-v2.md` and Korean translation with the stack profile selection rule.
- [ ] Update `docs/classification.md` and Korean translation if the backend map needs clearer wording.
- [ ] Avoid copying reference project names or raw upstream excerpts.

### Task 5: Validate And Commit

- [ ] Run `.\scripts\validate-skills.ps1`.
- [ ] Run `.\scripts\validate-translations.ps1`.
- [ ] Run `.\scripts\validate-public-docs.ps1`.
- [ ] Run `node bin\ai-playbook.mjs catalog check --json`.
- [ ] Run `git diff --check`.
- [ ] Stage explicit files, inspect staged diff, and commit.
