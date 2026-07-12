# Forge 권한 안내 0.5.6

AI Agent Playbook 0.5.6은 Projects 권한 경계를 강화하고 새 GitHub Project field에서 도구 이름 노출을 제거합니다.

## 권한 복구

- 사람이 읽는 `forge status` 출력에 구조화된 remediation의 브라우저 인증과 status 재확인 명령을 표시합니다.
- GitHub Projects를 우선 사용하는 bootstrap은 Project 또는 View capability가 없으면 안전하게 중단하고 mutation 전에 실행 가능한 operation을 0건으로 반환합니다.
- 차단된 preview에도 요청된 label, milestone, Project, View 수를 유지해 scope 승인 전에 의도한 협업 표면을 검토할 수 있습니다.
- 인증 scope 확대는 대화형 작업으로 유지합니다. 하네스가 `gh auth refresh`를 자동 실행하지 않습니다.

## 중립적인 Project field

- 새 managed Project는 `Delivery Status`, `Task ID`, `Phase`, `Priority`, `Risk`, `Progress`, `Area`를 사용합니다.
- View는 중립적인 delivery-status field를 기준으로 필터링하며 지역화된 View 이름을 유지합니다.
- 기존 `AAPB Status`, `AAPB Task ID`, `AAPB Phase`, `AAPB Priority`, `AAPB Risk`, `AAPB Progress`, `AAPB Area` field는 호환 alias로 유지합니다.
- Legacy field는 중복 생성, 파괴적 rename, 삭제 없이 재사용합니다. 두 형식이 모두 있으면 중립 field를 우선하며 기존 View 필터는 실제 재사용한 field에 맞게 조정합니다.
- 재개한 legacy field operation도 대응하는 중립 field를 재사용할 수 있습니다. 기존 중립 또는 legacy field의 type이 맞지 않거나 필수 single-select option이 없으면 누락 field를 만들기 전에 bootstrap을 중단하고 operator가 검토할 schema 충돌을 보고합니다.
