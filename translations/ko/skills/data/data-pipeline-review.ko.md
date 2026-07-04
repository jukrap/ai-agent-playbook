---
name: data-pipeline-review
description: Use when reviewing analytics pipelines, ETL jobs, batch processing, data contracts, quality checks, dashboards, or reporting datasets.
---

# Data Pipeline Review

파이프라인과 분석 신뢰성을 위한 기본 데이터 스킬입니다.

## 작업 절차

1. 출처 시스템, 변환 단계, 일정, 소유권, 소비자, 최신성 기대치를 확인합니다.
2. 스키마 변화, null 처리, 중복 제거, 늦게 도착한 데이터, 멱등성, 보강 작업, 지표 정의를 확인합니다.
3. 기준 데이터와 파생 보고서/생성 산출물을 분리합니다.
4. 가능하면 행 수, 정합성 질의, 표본 레코드, 대시보드 점검으로 검증합니다.

## 참고 자료

파이프라인 검토에 출처 계약 점검, 최신성 보장, 멱등 작업, 재실행/보강 계획, 데이터 품질 알림, 대시보드 정합성이 필요하면 `references/pipeline-reconciliation-and-backfill.md`를 읽습니다.
