---
name: legacy-change-safety
description: Use when changing legacy code where compatibility, hidden coupling, generated files, deployment shape, or regression risk matters more than modernization.
---

# 레거시 변경 안전성

호환성을 우선해야 하는 레거시 변경을 다룰 때 사용하는 기본 레거시 스킬입니다.

## 진행 절차

1. 코드를 바꾸기 전에 현재 동작을 확정합니다.
2. 파일, 스크립트, 생성 산출물, 배포 설정, 데이터베이스 산출물, 수동 운영 절차 사이의 숨은 결합을 확인합니다.
3. 요청을 만족하는 가장 작은 동작 보존 변경을 만듭니다.
4. 기존 경로와 새 경로를 검증하고 위험과 되돌림 메모를 기록합니다.

## 참고 자료

호환성 우선 변경 순서는 `references/legacy-change-control.md`를 읽습니다.

숨은 실행 경로, 데이터, 배포, 수동 운영 결합이 변경에 영향을 줄 수 있으면 `references/legacy-compatibility-map.md`를 읽습니다.
