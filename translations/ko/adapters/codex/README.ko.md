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

MCP를 사용하려면 공통 `~/.codex/config.toml`에 한 번 등록합니다. Codex가 서버를 해당 작업의 폴더에서 시작하고 AAPB는 그 폴더를 기본 프로젝트로 사용합니다. 일반적인 사용에는 `--project`나 저장소마다 별도의 `.codex/config.toml`이 필요하지 않습니다.

npm으로 전역 설치했다면 `npm root -g`로 패키지들이 설치된 상위 폴더를 확인합니다. 그 결과에 `/ai-agent-playbook/bin/aapb.mjs`를 붙여 아래 스크립트의 절대 경로로 넣으세요.

```toml
[mcp_servers.aapb]
command = "node"
args = ["<absolute-package-directory>/bin/aapb.mjs", "mcp"]
enabled = true
enabled_tools = ["aapb_status", "aapb_search", "aapb_read", "aapb_validate"]
```

예시의 서버 이름은 `aapb`입니다. AAPB가 다른 이름으로 이미 등록되어 있다면 새로 중복 등록하지 말고 기존 항목을 수정하세요. 데스크톱 앱과 터미널의 PATH가 다르면 Node 실행 파일도 절대 경로로 지정합니다. 작업 폴더를 자동으로 따르려면 서버 `cwd`와 `--project`는 비워 둡니다. 설치된 스크립트 경로는 한 번만 설정하며 프로젝트마다 바꾸지 않습니다.

위 TOML 예시에서 Windows 경로를 넣을 때는 역슬래시 이스케이프 문제를 피하도록 `/`를 사용하세요.

MCP 연결을 다시 불러오거나 앱을 재시작한 뒤 원하는 프로젝트에서 작업을 엽니다. `/mcp`에서 연결과 네 도구를 확인하고, 에이전트에 AAPB로 CURRENT.md를 읽어 달라고 요청하세요. 기록이 없으면 없다고 알려주며 자동 생성하지는 않습니다.

서버는 시작한 폴더에 계속 연결됩니다. 다른 저장소를 대화에서 언급하거나 셸에서 `cd`를 실행해도 기존 연결의 대상이 바뀌지는 않습니다. 다른 프로젝트의 기록을 쓰려면 그 프로젝트에서 작업을 시작합니다. AAPB가 부모 Git 루트를 자동으로 찾아 올라가지는 않습니다.

다른 경로나 고정된 대상을 의도적으로 읽어야 할 때만 `--project "<project>"`, 서버 `cwd` 고정 또는 프로젝트별 설정을 사용합니다. 대안과 출력 범위는 [MCP 설정](../../docs/mcp-permission-model.ko.md), 등록·연결 조작은 [공식 Codex MCP 안내](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)를 참고하세요.

구버전 공통 MCP 항목은 실행 명령과 도구 허용 목록을 확인하기 전까지 꺼 둡니다. 패키지를 설치해도 MCP가 자동으로 켜지지는 않습니다. 쓰기는 파일 도구나 명시적 CLI로 진행합니다.

AST 구조 검색을 사용하려면 기존 서버 args의 `mcp` 뒤에 `--with-ast`를 추가하고 허용 목록에도 `aapb_ast_search`를 넣습니다. 연결을 한 번 다시 불러온 뒤 도구 다섯 개를 확인하세요. 파서는 npm 선택 의존성입니다. [AST 검색](../../docs/ast-search.ko.md)을 참고하고 중복 서버는 등록하지 마세요.

## 과거 훅과 외부 플러그인

이전 패키지의 문맥 훅과 광범위 셸 래퍼는 종료했습니다. `hooks.example.json`은 빈 훅을 가진 비활성 예시로 바꿨으며 삭제된 스크립트를 가리키지 않습니다. 과거 자료의 훅 명령을 현재 설치에 복사하지 마세요.

플러그인 캐시, 계정 설치, 스킬 발견, 활성 MCP 서버는 각각 다릅니다. AAPB는 자신의 관리 스킬만 소유합니다. 다른 플러그인이나 공유 연결을 바꾸기 전에는 [공통 환경 구성](../../docs/environment-profiles.ko.md)을 참고하세요. [개인 템플릿](../../templates/codex-home/README.ko.md)은 선택 사항이며 기존 선호와 합쳐 적용합니다.
