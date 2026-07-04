---
name: git-worklog-guardrails
description: Use when staging files, committing, pushing, preparing PR text, release notes, or worklogs in a repository with local-only files or careful branch policy.
---

# Git/작업 기록 가드레일

Git, PR, 작업 기록 안전을 위한 기본 delivery 스킬입니다.

## 진행 절차

1. 브랜치, 원격 저장소, 추적 브랜치, 변경 파일, 스테이징된 파일, 로컬 전용 정책을 확인합니다.
2. 작업과 관련된 파일만 스테이징합니다.
3. 저장소가 정의한 명령으로 검증합니다.
4. 실제 diff와 실제 검증만 기반으로 커밋, PR, 작업 기록 문구를 작성합니다.
5. 관련 없는 사용자 변경은 건드리지 않습니다.

## 호환성

`commit-worklog-guardrails`는 이 스킬의 호환 트리거입니다.

## 참고 자료

스테이징, 커밋, 푸시, PR 문구 작성, 작업 기록 작성 전에는 `references/git-delivery-checklist.md`를 읽습니다.
