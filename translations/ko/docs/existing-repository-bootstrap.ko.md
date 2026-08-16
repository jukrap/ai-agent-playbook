# 기존 저장소 Bootstrap

Bootstrap은 운영자가 소유권 모드를 명시적으로 고르기 전까지 기존 루트 `AGENTS.md`를 사용자 소유로 취급합니다. 모드가 없는 충돌은 어떤 파일도 쓰기 전에 중단합니다.

## 소유권 모드 선택

```powershell
# 저장소에 제품별 지침이 이미 있을 때 권장
aapb bootstrap <target> --local-only --preserve-agents

# 짧은 플레이북 읽기 순서 블록만 추가하고 관리
aapb bootstrap <target> --local-only --link-agents

# 루트 정책 전체를 의도적으로 교체
aapb bootstrap <target> --replace-agents --force
```

- `--preserve-agents`는 `AGENTS.md`를 byte 단위로 유지하고 프로젝트 플레이북만 설치합니다.
- `--link-agents`는 사용자 내용 밖에 marker 소유 읽기 순서 블록 하나만 추가하거나 갱신합니다.
- `--replace-agents --force`는 전체 파일을 교체하고 전체 hash를 관리합니다.
- `--force`만으로는 기존 루트 정책을 교체하지 않습니다.

세 모드는 상호 배타적입니다. 기존 `AGENTS.md`와 `--profile`을 함께 사용하면 생성 profile과 제품 지침이 충돌할 수 있으므로 수동 통합이 필요합니다.

## 사전 점검과 동시 편집

`--json`으로 예정된 쓰기, 보존 파일, 충돌, 경고, 다음 명령을 검토합니다. Bootstrap은 사전 점검 때 보호 파일 snapshot을 만들고 실제 쓰기 직전에 다시 확인합니다. 그 사이 `AGENTS.md`나 `.gitignore`가 바뀌면 부분 설치 없이 전체 작업을 중단합니다.

보호 경로가 안전하게 소유권을 확인할 수 없는 symbolic link이거나 관리 marker가 잘못된 경우에도 중단합니다. Link를 따라가 대상 저장소 밖의 파일을 덮어쓰지 않습니다.

## `.gitignore` 동작

Local-only bootstrap은 기존 `.gitignore` 내용을 보존하며 동등한 pattern이 없을 때만 `.ai-agent-playbook/`을 추가합니다. UTF-8 BOM 상태, CRLF 또는 LF, 순서, 주석, 기존 마지막 개행 선택을 유지합니다. 파일을 정렬하거나 정규화하거나 전체 교체하지 않습니다.

`--local-only`는 프로젝트 플레이북 기억을 Git에서 제외한다는 기존 의미를 유지합니다. 프로젝트 나머지 부분의 Git 또는 Forge 사용을 끄는 옵션은 아닙니다.

## 관리 수명주기

설치 manifest는 루트 정책 소유권을 기록합니다.

- `preserved`: `AGENTS.md`를 관리 파일로 등록하지 않습니다.
- `linked`: marker 블록만 관리합니다.
- `generated` 또는 `replaced`: 전체 파일 hash를 관리합니다.

`managed check`는 소유한 표면만 비교합니다. `managed uninstall`은 linked mode에서 관리 블록만 제거하고 주변 사용자 내용을 남깁니다. Doctor는 명시적 preserve mode를 정상으로 인정하고 루트 정책이 관리되지 않는다는 경고를 반복하지 않습니다. 소유권 field가 없는 기존 manifest도 계속 읽습니다.

중요한 저장소에 적용하기 전에 작업 트리를 검토 가능한 상태로 두고 JSON 또는 dry-run preview를 실행합니다. 단순히 통합 결정을 피하려고 replace mode를 사용하지 않습니다.
