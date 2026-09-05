# Forge 협업

GitHub/Gitea 연동은 검토된 협업 계획, 기존 관리 marker, 동시 수정 검사, 중복 재사용과 부분 실패 결과를 유지합니다. 작업 실행·예약·소스 변경·커밋·push를 담당하지 않습니다.

forge status는 로컬 확인입니다. bootstrap·sync·reconcile은 --apply가 없으면 미리보기입니다. sync·reconcile은 프로젝트 상대 경로의 검토된 JSON 계획을 읽습니다. 기존 provider operation 계획과 task/coordination 입력을 지원하며 provider는 선택한 저장소 remote와 일치해야 합니다.

--offline·--no-remote·--remote-read-only는 원격 쓰기를 막습니다. 인증은 명시적인 원격 적용에만 확인합니다. 파괴적 작업과 provider 기능 제한의 기존 보호를 유지하며 읽기 미리보기는 자격 증명이나 원격 전송을 사용하지 않습니다.

provider 테스트는 모의 전송으로 중복·오래된 updatedAt·권한 실패·재시도·부분 적용을 검증하며 실제 원격 게시의 근거는 아닙니다. 기존 자동화·예약 기록은 records 읽기와 고정 0.5.11 복구로 접근할 수 있으며 자동 변경·삭제하지 않습니다.
