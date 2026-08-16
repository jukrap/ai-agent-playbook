# 런타임 엔진과 이식성

AI Agent Playbook은 Node.js를 안정적인 CLI·MCP 진입 계층으로 사용하고 Python은 선택적 로컬 분석 엔진으로 둡니다. 언어별 파일 개수는 기능 목표가 아닙니다.

## Node.js가 주 런타임인 이유

npm package, `aapb` 실행 파일, MCP server, bootstrap 수명주기, Git·Forge adapter, scheduler, automation controller는 하나의 cross-platform 설치에서 동작해야 합니다. 이 계약을 Node runtime에 두면 일반적인 프로젝트 설정과 협업에 두 번째 언어 환경을 요구하지 않습니다.

Python이 없어도 Node 기반 명령은 계속 사용할 수 있습니다. 런타임은 결정적인 파일 시스템·프로세스 계약을 우선하고 네트워크와 쓰기 권한을 명시적으로 유지합니다.

## Python의 역할

Python 3.11+는 더 깊은 로컬 언어 분석에 권장합니다. 현재 선택 engine은 `writing naturalness-check`와 `writing naturalness-report`에 한국어·영어 문체 신호를 제공합니다. `kss`, `kiwipiepy` 같은 library가 설치되어 있으면 사용하고 없으면 건너뜁니다.

Interpreter 탐색은 `AI_AGENT_PLAYBOOK_PYTHON`, 저장소 로컬 `.venv`, `python`, `python3`, Windows `py -3` 순서입니다. 후보마다 별도 process 경계에서 검사하므로 잘못된 platform alias가 뒤의 정상 interpreter를 숨기지 않습니다. JSON 결과는 Python이 없다는 이유로 하네스 전체를 실패시키지 않고 사용한 engine과 사용할 수 없는 engine을 기록합니다.

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python -m pip install -U pip kss kiwipiepy
$env:AI_AGENT_PLAYBOOK_PYTHON = ".\.venv\Scripts\python.exe"
aapb runtime python-status --json
```

## Python을 더 추가하는 기준

새 Python 기능은 성숙한 언어 tokenization, 통계 분석, 특화 로컬 library처럼 이식 가능한 Node 경로에서 신뢰성 있게 구현하기 어려운 측정 가능한 이점이 있어야 합니다. 공개 설치 계약을 바꾸지 않는 한 로컬·제한적·테스트 가능·선택적이어야 합니다. 사용할 수 없는 엔진도 명확히 보고해야 합니다.

특정 저장소의 build script가 많다고 이 하네스에도 같은 script가 필요하다는 뜻은 아닙니다. 검토한 문서 작성 참고 자료에는 taxonomy 파생 문서, 긴 문서 chunk 준비와 재조립, release image 생성, 해당 domain 전용 rewrite gate가 각각 별도 프로그램으로 있습니다. 이들은 자체 content taxonomy, golden corpus, workflow directory, font, publishing asset에 의존합니다. 복사하면 재사용 가능한 개발 기능이 아니라 제품 결합이 늘어납니다.

일반화할 수 있는 원칙인 결정적 수정 전후 비교, 수치와 identifier 보호, 문장 touch 근거, register 검토, 수사 구조 보존 검토는 플레이북 품질 명령에 반영했습니다. Domain 고정 변경률과 작성자 스타일 점수는 의도적으로 채택하지 않았습니다. `writing fidelity-check`는 비율로 수정을 자동 거절하지 않고 근거를 보고합니다.

## Hosted runtime 정렬

생성된 GitHub Actions와 Gitea Actions workflow는 package release metadata에서 정확한 `ai-agent-playbook` package pin을 가져옵니다. Forge 요청도 같은 version을 식별자에 사용합니다. 이미 복사된 workflow는 보존하며 새 schedule preview 또는 현재 template을 검토한 뒤에만 갱신합니다.

외부 workflow Action은 계속 전체 commit SHA로 고정합니다. 기존 run ledger, plan, checkpoint, permission, repository variable, kill switch는 선택한 Python interpreter에 의존하지 않습니다.
