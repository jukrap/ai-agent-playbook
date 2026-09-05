# Codex 설정

AAPB는 일반 파일로 쓰는 기록과 선택한 스킬을 제공합니다. 편집·실행·예약은 설치된 앱의 기본 도구를 사용합니다. AAPB가 모델을 고르거나 문맥 수치를 바꾸거나 개인 환경 전체를 설정하지 않습니다.

## 선택한 스킬 설치하기

검증한 CLI로 개발 프로필을 미리 봅니다.

```powershell
ai-agent-playbook skills install --profile development --dry-run --json
ai-agent-playbook skills install --profile development --json
ai-agent-playbook skills check --profile development --json
```

기본 사용자 경로는 `.agents/skills`입니다. 같은 스킬을 `.codex/skills`에도 복제하지 마세요. 알려진 구버전 복사본은 [설치 안내](../../docs/lifecycle.ko.md)에 따라 명시적으로 이전합니다. 목록을 다시 불러오거나 새 세션에서 실제 다섯 이름을 확인하세요. 디스크 파일과 대화에 들어간 지침은 별개의 관측입니다.

## 프로젝트 기록 사용하기

프로젝트 지침을 따르고 CURRENT.md와 필요한 상세 기록을 읽습니다. 구현·검증은 프로젝트의 기존 도구로 진행합니다. 현재 사실과 다음 할 일은 평소처럼 파일을 편집해 적습니다. 일반 Markdown을 읽는 데 스킬이 필수는 아닙니다.

기존 모델, 추론, 문맥, 압축, 출력, 서비스 설정을 보존합니다. AAPB 설치는 실험적인 history/notes 기능을 켜지 않습니다. 공개 코드의 기능, 설치 버전 정보, 도구 표시, 호출 성공은 서로 다른 근거입니다.

## 선택형 MCP

원할 때만 `ai-agent-playbook mcp --project "<project>"`를 프로젝트에 연결합니다. [MCP 설정](../../docs/mcp-permission-model.ko.md)에 명령·인자, 예상 도구, 로딩 확인 방법이 있습니다. 데스크톱 앱과 터미널의 PATH가 다르면 Node·스크립트 절대 경로가 유용합니다.

기존 공통 MCP 항목은 의도적으로 갱신하기 전까지 꺼 둡니다. 서버는 `aapb_status`, `aapb_search`, `aapb_read`, `aapb_validate`만 제공합니다. 쓰기는 파일 도구나 명시적 CLI로 진행합니다.

## 과거 훅과 외부 플러그인

이전 패키지의 문맥 훅과 광범위 셸 래퍼는 종료했습니다. `hooks.example.json`은 빈 훅을 가진 비활성 예시로 바꿨으며 삭제된 스크립트를 가리키지 않습니다. 과거 자료의 훅 명령을 현재 설치에 복사하지 마세요.

플러그인 캐시, 계정 설치, 스킬 발견, 활성 MCP 서버는 각각 다릅니다. AAPB는 자신의 관리 스킬만 소유합니다. 다른 플러그인이나 공유 연결을 바꾸기 전에는 [공통 환경 구성](../../docs/environment-profiles.ko.md)을 참고하세요. [개인 템플릿](../../templates/codex-home/README.ko.md)은 선택 사항이며 기존 선호와 합쳐 적용합니다.
