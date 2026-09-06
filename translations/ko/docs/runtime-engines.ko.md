# Node와 선택형 Python 실행 환경

CLI와 MCP 서버는 Node.js로 실행합니다. Python은 한국어·영어 문서의 추가 점검 신호가 필요할 때 선택합니다. 기록 조회와 JavaScript 문서 점검에는 모델 API나 별도 서비스가 필요하지 않습니다.

## 필요한 구성

| 구성 | 조건 | 용도 |
| --- | --- | --- |
| Node.js | `18+` | CLI, MCP, 설치, JavaScript 점검 |
| npm | 일반적인 Node 설치에 포함 | 패키지 의존성과 압축 파일 설치 |
| Python | 선택 사항, `3.11+` | 추가 문서 분석 |
| `kss`, `kiwipiepy` | 선택형 Python `ko` 추가 구성 | 한국어 분석 기능 |
| TypeScript | 개발 의존성 | 소스 검사. 런타임 분석 서비스가 아님 |

공개 최소 조건과 실제 시험한 버전은 구분합니다. 실행해 본 버전은 [검증 보고서](verification.ko.md)에 있습니다. 읽기 전용 [AST 검색](ast-search.ko.md)은 선택 의존성 `@ast-grep/napi`를 호출할 때만 로딩합니다. 일반 npm 설치에는 포함되며 `--omit=optional`로 제외해도 기록 도구는 사용할 수 있습니다. 종료한 이미지 비교 기능의 PNG-diff 의존성은 포함하지 않습니다.

## JavaScript로 시작하기

```powershell
ai-agent-playbook writing naturalness-check "<project>" --path README.md --lang auto --engine js --json
```

CLI 기본값은 `js`입니다. 유지한 문서 점검 구현에서 `--engine auto`와 `--engine python`은 둘 다 선택형 Python 탐색을 요청합니다. Python을 실행하지 못하면 JavaScript 결과를 유지하고 엔진을 사용할 수 없었다고 표시합니다. `engines.requested`, `engines.used`, `engines.unavailable`과 경고를 확인하세요. Python을 요청한 것만으로 실제 실행했다고 판단하지 않습니다.

## 소스 폴더에서 Python 준비하기

PowerShell 도우미는 `.venv`를 만들고 선택형 추가 구성을 설치합니다.

```powershell
.\scripts\bootstrap-python.ps1
node bin/aapb.mjs runtime python-status --json
```

직접 준비할 때는 소스의 Python 패키지 설정을 사용합니다.

```sh
python -m venv .venv
.venv/bin/python -m pip install -e '.[ko]'
node bin/aapb.mjs runtime python-status --json
```

Windows에서는 `.venv/bin/python` 대신 `.venv/Scripts/python.exe`를 사용합니다. `python`이 다른 버전을 가리킨다면 Python 3.11 이상 실행 파일을 직접 고르세요. npm 압축 파일에는 Python 엔진 소스가 포함되지만 Node 의존성을 설치한다고 선택형 Python 라이브러리까지 설치되지는 않습니다.

## 특정 인터프리터 선택하기

필요하면 PowerShell 세션에서 실행 파일을 지정합니다.

```powershell
$env:AI_AGENT_PLAYBOOK_PYTHON = '"<absolute-python-executable>"'
ai-agent-playbook runtime python-status --json
```

자리표시자를 실제 경로로 바꾸고, 공백이 있으면 안쪽 따옴표도 유지하세요. 탐색은 환경 변수, 패키지 소스의 `.venv`, 사용 가능한 `python`, `python3`, `py -3` 후보를 확인합니다. 여기서 가상 환경은 패키지·소스 폴더 기준이며 대상 프로젝트의 가상 환경을 자동 선택하는 것은 아닙니다.

후보 하나의 확인 시간은 최대 8초입니다. `python-status`에서 선택한 인터프리터와 후보별 오류를 볼 수 있습니다. 시간 초과는 느리거나 잘못된 시작 때문일 수 있으며 미설치를 뜻하지는 않습니다. 설정을 바꾸기 전에 출력된 명령과 엔진 불러오기 오류를 확인하세요.

## 버전과 검증

정식 Node 패키지와 Python 엔진은 모두 `1.0.0`을 사용합니다. 이후 사전 릴리스에서는 npm의 `next.N`을 Python PEP 440의 `devN`에 대응합니다. 엔진 동작을 개발·수정했다면 `npm run validate:python`을 실행합니다. 사용자 환경에 선택형 엔진이 없는 것과 개발에 필요한 검사가 실패한 것은 다른 상황입니다.

문서 점검 결과는 참고용입니다. 모든 신호를 수정 요구로 보지 않고 의미와 문체를 보존하는 방법은 [품질 검토](quality-review.ko.md)에 있습니다.
