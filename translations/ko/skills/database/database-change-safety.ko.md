---
name: database-change-safety
description: Use when changing database schema, migrations, SQL, reporting queries, stored procedures, seed data, or data integrity rules.
---

# Database Change Safety

안전한 데이터 변경을 위한 기본 데이터베이스 스킬입니다.

## 작업 절차

1. 데이터 소유권, 읽기 경로, 쓰기 경로, 마이그레이션 순서, 롤백 필요성, 예상 데이터 규모를 확인합니다.
2. 추가형, 호환성 민감형, 파괴형, 보강형 변경을 분리합니다.
3. 색인, 잠금, null 허용 여부, 기본값, 제약, 보고서 소비자, 배포 순서를 확인합니다.
4. 가능하면 마이그레이션 사전 실행, 전후 질의, 애플리케이션 호환성 점검으로 검증합니다.

## 참고 자료

데이터베이스 변경에 확장/축소 순서, 온라인 안전성 점검, 보고서 소비자 검토, 저장 프로시저 영향, 데이터 보강 계획, 롤백 근거가 필요하면 `references/database-change-review-matrix.md`를 읽습니다.
