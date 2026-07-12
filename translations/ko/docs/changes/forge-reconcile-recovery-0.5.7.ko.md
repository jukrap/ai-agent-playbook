# Forge Reconcile 복구 0.5.7

AI Agent Playbook 0.5.7은 표시 구조 supersede 마이그레이션이 부분 적용된 뒤에도 검토된 reconcile을 안전하게 재개할 수 있게 합니다.

## CAS 안전 supersede 순서

- 오래된 issue는 marker 댓글이나 native sub-issue 관계를 바꾸기 전에 검토한 `updatedAt` snapshot으로 먼저 종료합니다.
- 실패하면 같은 delivery group의 뒤 operation을 차단하므로 다음 preview가 stale snapshot으로 계속하지 않고 원격 권위 상태를 다시 읽습니다.
- 기존 issue, comment, label 정의는 보존합니다. Drift가 있는 issue를 강제로 갱신하지 않습니다.

## 중단 실행 복구

- Managed issue 점검은 중단된 실행에서 parent 관계만 이미 제거된 열린 issue를 다시 찾을 수 있습니다.
- 복구 대상은 승인된 coordination group의 task ID로 제한하며 승인된 plan, group, issue 번호가 모두 일치하는 정확한 `aapb:superseded` marker가 필요합니다.
- 중복 plan, task, group, supersede comment marker는 모호한 상태로 취급합니다. 정확한 marker가 없는 issue는 복구하지 않으며, marker 점검이 모호하거나 실패하거나 pagination 한도를 넘으면 쓰기를 차단합니다.

## Managed Project 정리

- Preview는 보장할 Project item과 제거할 오래된 Project item을 구분해 보고합니다.
- 오래된 task card 제거는 기존 `--allow-supersede` 승인 gate 아래 GitHub 공개 `deleteProjectV2Item` mutation을 사용합니다.
- Parent에 연결된 issue는 마지막 계층 해제 전에 오래된 Project card를 제거하고, 복구한 unlinked issue는 종료 전에 제거하므로 모든 실패 상태를 다음 preview가 다시 찾을 수 있습니다.
- Provider는 Project card를 찾기 전에 현재 저장소 issue node ID를 확인하므로 다른 저장소의 같은 번호 issue를 선택하지 않습니다.
- 잘못 구성된 plan이 승인 metadata를 빼더라도 Project item과 sub-issue 제거는 apply 경계에서 `--allow-supersede`를 요구합니다. Project item 제거는 멱등적이며 기반 issue를 삭제하거나 다시 쓰지 않습니다.
