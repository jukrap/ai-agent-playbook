---
name: git-worklog-guardrails
description: Use when staging files, committing, pushing, preparing PR text, release notes, or worklogs in a repository with local-only files or careful branch policy.
---

# Git Worklog Guardrails

git, PR, worklog 안전을 위한 primary delivery skill입니다.

## Workflow

1. branch, remote, upstream, dirty files, staged files, local-only policy를 확인합니다.
2. task와 관련된 file만 stage합니다.
3. repository가 정의한 command로 검증합니다.
4. 실제 diff와 실제 verification만 기반으로 commit, PR, worklog text를 작성합니다.
5. 관련 없는 사용자 변경은 건드리지 않습니다.

## Compatibility

`commit-worklog-guardrails`는 이 skill의 compatibility trigger입니다.

