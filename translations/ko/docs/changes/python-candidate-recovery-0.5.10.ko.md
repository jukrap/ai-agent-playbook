# Python Candidate 복구 0.5.10

0.5.10은 platform command alias 하나가 process 생성 중 동기적으로 실패해도 Python capability 탐색을 계속할 수 있게 합니다.

## 변경 사항

- 각 interpreter candidate를 자체 process 생성 경계 뒤에서 probe합니다.
- 동기적인 spawn 실패는 전체 `pythonEngineStatus` operation을 reject하지 않고 해당 candidate에 기록합니다.
- 탐색은 문서화된 순서에 따라 repo-local virtual environment, `python`, `python3`, Windows `py -3` candidate로 계속됩니다.
- Interpreter 선택 뒤 naturalness engine도 같은 주입 가능한 spawn 경계를 사용합니다.
- Python module version은 Node package와 Python distribution release metadata에 맞추고 packaging test가 이후 불일치를 거부합니다.

## 호환성과 안전성

- Candidate 순서와 JSON status 계약은 바뀌지 않습니다.
- 실패한 candidate는 process error와 함께 unavailable로 보고하며, 다른 candidate도 선택되기 전에 Python engine import 가능성을 증명해야 합니다.
- Bridge는 계속 local, non-daemon, file-read-only, network-free로 동작합니다.

## 검증 초점

- Candidate 하나에서 모의 동기 `spawn UNKNOWN`이 발생해도 정상 interpreter를 숨기지 않습니다.
- `python.exe`는 동작하지만 `python3` App Execution Alias를 spawn할 수 없는 실제 Windows 검증 경로가 성공합니다.
