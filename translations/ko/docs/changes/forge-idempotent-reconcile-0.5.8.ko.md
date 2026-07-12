# Forge 멱등 Reconcile 0.5.8

AI Agent Playbook 0.5.8은 표시 구조 reconcile에서 의미 있는 원격 변경만 보고하고 쓰도록 보강합니다.

## Provider 확인 preview

- `forge reconcile`은 실제 provider adapter를 read-only transport 뒤에서 실행해 계획한 operation을 확인합니다.
- 재사용 가능하다고 증명된 operation은 실행 preview에서 제외하고 `noOps`로 보고하며, 쓰기 경계에 도달한 operation만 계획에 남깁니다.
- 산출물 수는 걸러진 operation을 기준으로 표시하고, `plannedOperations`에는 감사 가능한 원래 의도 수를 유지합니다.

## Project 수렴

- GitHub가 빈 text 값을 item 응답에서 생략하는 동작에 맞춰 Project text field가 없고 목표 값이 명시적인 빈 문자열이면 같은 상태로 취급합니다.
- Project가 자동으로 만든 `View 1`은 managed `all` 역할을 충족할 수 있으므로 table View를 하나 더 만들지 않습니다. GitHub의 안정 공개 View API는 View 생성만 지원하고 system View의 rename이나 delete를 지원하지 않으므로 표시 이름을 바꿨다고 주장하지 않습니다.
- 이 수렴 과정은 기존 사용자 View나 Project item을 삭제하지 않습니다.

## Legacy managed body 마이그레이션

- 검토된 표시 구조 reconcile은 managed block 바로 앞에 남아 있는 과거 생성형 목표·수용 기준 preamble을 교체할 수 있습니다.
- 정확한 legacy marker 형태와 CAS로 보호된 issue snapshot에서만 마이그레이션합니다. 해당 형태 밖의 사용자 문서와 managed block 뒤의 문서는 보존합니다.
