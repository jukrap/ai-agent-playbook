# Decisions

미래 작업이 다시 발견하지 않아도 되는 durable decisions를 이 폴더에 둡니다.

추천 형식:

```md
# YYYY-MM-DD Short Decision Title

## Decision
- 이제 사실인 것.

## Context
- 이 결정이 필요했던 이유.

## Consequences
- 가능해지는 것.
- 배제되거나 더 어려워지는 것.

## Evidence
- code, docs, worklogs, issues, command output 링크.
```

## Rules

- 모든 임시 선호가 아니라 durable decision을 기록합니다.
- worklog에 현재에도 유효한 decision이 있으면 여기로 승격합니다.
- decision이 뒤집히면 새 decision을 추가하고 old one을 링크합니다.
