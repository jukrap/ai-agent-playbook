# AI Agent Playbook 1.3.0

선택형 라이트 스킬 설치를 추가하고 대체 스킬을 설치하지 못했을 때 기존 프로필을 보호하는 릴리스입니다. 기본 core 프로필, 프로젝트 기록 형식과 MCP 설정은 호환성을 유지합니다.

## 달라지는 점

- `--profile light`는 참고 자료 묶음 없이 간결한 `project-notes` 하나를 선택합니다. 간단한 작업 연속성, 필요한 기록 읽기와 결과 중심 응답을 안내하며 필수 고지와 앱 지침을 따릅니다. core는 계속 두 개, development는 다섯 개를 선택합니다.
- CLI와 PowerShell 설치에서 라이트 설치·갱신·확인·삭제·명시적 이전을 지원합니다. 일반 설치는 추가 방식이므로 명시적으로 삭제하거나 이전하기 전에는 기존 스킬이 남습니다.
- 프로필 이전은 소유권과 정확한 파일 검사를 통해 알려진 현재·구버전 AAPB 설치본을 정리합니다. 정리 전에는 선택한 모든 대체 설치본이 유효해야 합니다. 선택 설치의 충돌이 있으면 제거를 계획하지 않고, 적용 중에도 제거마다 대체 설치본을 재확인합니다. 대체 설치가 실패하거나 바뀌면 남은 제거를 중단합니다.
- 독립적으로 안전한 설치와 정리는 계속 지원합니다. 수정본·미관리·연결된 디렉터리와 다른 플러그인을 보존하고 완료한 작업의 복구 자료를 남깁니다.
- 부트스트랩에는 기존 `--records minimal`을 사용합니다. 별도 라이트 부트스트랩 옵션이나 기록 이전은 필요하지 않습니다.

라이트는 선택한 지침 묶음을 줄입니다. 모델 설정, 권한, 필수 고지, 서비스 로그나 회사 감사 기록은 바꾸지 않습니다. 전역 응답 설정이나 토큰·비용 절감 보장 기능이 아닙니다. [라이트 모드](skill-catalog.ko.md#라이트-모드)를 참고하세요.

## 설치와 전환

npm 게시가 끝난 뒤 정확한 릴리스를 설치합니다.

```sh
npm install -g ai-agent-playbook@1.3.0
ai-agent-playbook --version
```

GitHub 릴리스와 npm 게시는 별개입니다. 레지스트리에 버전이 올라가기 전에는 [로컬 패키지 시험](demo.ko.md)에 따라 검증된 릴리스 압축 파일을 npm으로 설치할 수 있습니다.

처음 스킬을 설치할 때는 다음을 실행합니다.

```sh
ai-agent-playbook skills install --profile light --dry-run --json
ai-agent-playbook skills install --profile light --json
ai-agent-playbook skills check --profile light --json
```

기존 설치를 줄이려면 전체 제거 계획을 확인한 뒤 적용합니다.

```sh
ai-agent-playbook skills migrate --profile light --json
ai-agent-playbook skills migrate --profile light --apply --json
```

별도로 선택한 레거시 스킬도 제거 대상일 수 있으므로 유지할 스킬은 `--skill` 목록에 모두 포함하세요. 반환된 백업을 보관합니다. 일부 적용된 작업은 이미 끝난 변경을 자동으로 되돌리지 않습니다. 적용 후에는 앱을 다시 불러와 실제 스킬 목록을 확인하세요. [프로필 전환](lifecycle.ko.md#라이트-설치와-프로필-전환)에 자세한 내용이 있습니다.

## 복구와 범위

`skills rollback --backup "<transaction-directory>" --json`으로 복구를 미리 확인하고 `--apply`로 실행합니다. 최신 작업부터 되돌리세요. 기능 구성을 바꾸려면 core나 development로의 이전을 미리 확인합니다. 이전 CLI로 돌아가려면 `npm install -g ai-agent-playbook@1.2.2`를 사용합니다. CLI만 바꿔서는 설치된 스킬이 복원되지 않습니다.

로컬·패키지 검증은 [검증 기록](verification.ko.md)에 남깁니다. 모든 앱에서의 자동 선택, 실제 토큰 절감이나 npm 게시를 입증하는 검증은 아닙니다. 실제 사용자 설치와 외부 서비스 설정 변경은 릴리스 준비와 별개입니다.
