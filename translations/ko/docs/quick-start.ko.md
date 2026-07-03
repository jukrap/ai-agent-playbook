# 처음 10분 사용법

이 문서는 처음 쓰는 사람이 “무엇을 실행하면 되는지”, “어떤 명령이 파일을 바꾸는지”, “무엇을 기대하면 되는지”만 빠르게 파악하기 위한 안내입니다.

AI Agent Playbook에는 서로 다른 네 계층이 있습니다.

| 계층 | 의미 | 설치 위치 |
| ---- | ---- | --------- |
| CLI 패키지 | `ai-playbook` 명령과 함께 묶인 원본 파일입니다. | npm 캐시, npm 전역 위치, 또는 특정 프로젝트의 `node_modules`. |
| 스킬 | 온보딩, 리뷰, UI 다듬기, 레거시 유지보수 같은 재사용 에이전트 지침입니다. | `.codex/skills`, `.agents/skills` 같은 사용자 수준 스킬 폴더. |
| 프로젝트 플레이북 | `.ai-playbook/` 아래의 로컬 프로젝트 기억입니다. 현재 사실, 작업 어휘, 지도, 실행 기록, 계약, 작업 기록을 포함합니다. | 대상 프로젝트 저장소 하나. |
| MCP 도구 | AI 앱이 문맥, 검색, 진단, AST 검색, 함수 본문 중복 단서, TypeScript/JavaScript 분석을 호출할 수 있는 선택적 읽기 전용 도구입니다. | AI 앱에 로컬 표준 입출력 서버 명령으로 등록합니다. |

npm 패키지를 설치해도 스킬 설치, 프로젝트 `.ai-playbook/` 생성, MCP 설정 등록은 자동으로 일어나지 않습니다. 이 단계들은 명시적으로 실행합니다.

## 1. 전역 설치 없이 CLI 실행

처음에는 `npx`를 사용합니다. published package를 한 번 실행할 뿐이며 현재 프로젝트에 dependency를 추가하지 않습니다.

```powershell
npx ai-agent-playbook --help
```

어느 디렉터리에서든 짧은 명령을 쓰고 싶을 때만 전역 설치를 사용합니다.

```powershell
npm install -g ai-agent-playbook
ai-playbook --help
```

그 뒤에는 `ai-playbook ...`과 `npx ai-agent-playbook ...`이 같은 종류의 명령이라고 보면 됩니다. 아래 예시는 부담이 가장 적은 `npx`를 기준으로 씁니다.

## 예시 명령 읽는 법

- 꺾쇠괄호를 그대로 입력하지 않습니다. `<target-project>`는 검사할 프로젝트 폴더로 바꿉니다.
- 터미널이 이미 그 프로젝트 안에 있다면 target으로 `.`을 쓸 수 있습니다.
- 공백이 있는 경로나 문장은 따옴표로 감쌉니다. 예: `".\example app"`, `"auth flow change"`.
- 옵션은 `--`로 시작합니다. 예를 들어 `--dry-run`은 쓰기 작업을 미리 보여주고, `--json`은 구조화된 출력을 보여줍니다.
- 공유 문서, 이슈, PR에는 개인 폴더, 고객명, 자격 증명, 내부 URL을 넣지 않습니다. 다른 사람에게 보여줄 예시는 `<target-project>` 같은 자리표시자를 사용합니다.

## 2. 스킬 설치 미리 보기

스킬은 agent가 참고하는 재사용 guidance입니다. 모든 프로젝트에 복사되는 파일이 아닙니다.

```powershell
npx ai-agent-playbook skills install --dry-run
```

출력을 읽어 봅니다. 대상 프로젝트가 아니라 사용자 스킬 루트가 표시되어야 합니다. 충돌이 나오면 강제 옵션을 쓰기 전에 멈추고 먼저 확인합니다.

## 3. 스킬 설치

미리 보기가 괜찮으면 설치합니다.

```powershell
npx ai-agent-playbook skills install
```

스킬 설치 뒤에는 Codex를 재시작하거나 새 에이전트 세션을 시작해야 새 스킬 메타데이터를 읽을 수 있습니다.

## 4. 대상 프로젝트를 쓰기 전에 점검

`<target-project>`는 검사하거나 bootstrap할 프로젝트 폴더입니다. 터미널이 이미 그 프로젝트 안에 있다면 `.`을 써도 됩니다.

```powershell
npx ai-agent-playbook operator check <target-project> --json
```

이 명령은 읽기 전용입니다. 프로젝트 플레이북 존재 여부, 가이드 최신 상태, 가능한 검증 명령, 적용될 수 있는 로컬 규칙을 확인합니다.

## 5. 프로젝트 bootstrap 미리 보기

`bootstrap`은 루트 `AGENTS.md`와 `.ai-playbook/` 같은 프로젝트 수준 파일을 만듭니다.

```powershell
npx ai-agent-playbook bootstrap <target-project> --dry-run
```

대상 프로젝트에서 `.ai-playbook/`을 Git에 올리지 않을 거라면 `--local-only`를 붙입니다.

```powershell
npx ai-agent-playbook bootstrap <target-project> --local-only --dry-run
```

미리 보기가 맞을 때만 적용합니다.

```powershell
npx ai-agent-playbook bootstrap <target-project> --local-only
```

프로젝트에서 `.ai-playbook/`을 커밋해야 한다면 `--local-only`를 빼고 실행합니다.

## 6. 위험한 수정 전후 비교

파일을 바꾸기 전에 baseline을 남기고 싶으면 preflight를 사용합니다.

```powershell
npx ai-agent-playbook operator preflight <target-project> --intent "planned change" --json > preflight.json
```

작업을 진행한 뒤 현재 프로젝트와 baseline을 비교합니다.

```powershell
npx ai-agent-playbook operator delta <target-project> --before preflight.json --json
```

Delta는 무엇이 달라졌는지만 보여줍니다. 구현이 맞는지는 판정하지 않습니다.

## 선택 사항: AI 앱이 도구를 대신 호출하게 하기

사용 중인 AI 앱이 MCP를 지원한다면 아래 로컬 서버 명령을 등록할 수 있습니다.

```powershell
npx ai-agent-playbook mcp
```

처음 10분에는 필수가 아닙니다. 등록하면 AI가 운영자 검색, 심층 분석, 계약 점검, 이미지 차이 같은 읽기 전용 도구를 명령어 암기 없이 호출할 수 있습니다.

## 7. 나중에 업데이트하거나 제거

설치된 스킬 업데이트:

```powershell
npx ai-agent-playbook skills update --dry-run
npx ai-agent-playbook skills update
```

이 playbook이 설치한 수정되지 않은 관리 대상 스킬만 제거:

```powershell
npx ai-agent-playbook skills uninstall --dry-run
npx ai-agent-playbook skills uninstall
```

대상 프로젝트 하나에서 프로젝트 플레이북을 제거할 때는 미리보기 우선 관리 파일 정리를 사용합니다.

```powershell
npx ai-agent-playbook managed check <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --json
npx ai-agent-playbook managed uninstall <target-project> --apply --json
```

관리 파일 제거는 수정된 프로젝트 기억을 보존하며 `.gitignore`를 수정하지 않습니다.

## 짧은 용어 정리

| 용어 | 의미 |
| ---- | ---- |
| `npx ai-agent-playbook` | 전역 설치 없이 배포 패키지를 실행합니다. 기본으로 추천합니다. |
| `ai-playbook` | `npm install -g ai-agent-playbook` 뒤 사용할 수 있는 짧은 명령입니다. |
| `node .\bin\ai-playbook.mjs` | 이 저장소 소스 체크아웃에서 직접 실행합니다. |
| `skills install` | 재사용 스킬을 사용자 수준 스킬 폴더에 복사합니다. |
| `bootstrap` | 프로젝트 기억 파일을 대상 프로젝트 하나에 복사합니다. |
| `operator check` | 읽기 전용 프로젝트 상태 점검입니다. |
| `mcp` | AI 앱용 로컬 읽기 전용 MCP 서버를 시작합니다. |
| `--dry-run` | 파일을 바꾸는 명령을 미리 보기만 합니다. |
| `--apply` | 미리보기 우선 관리 작업을 실제 적용합니다. |
| `--json` | 에이전트와 스크립트가 읽기 쉬운 구조화된 출력을 냅니다. |

## 하지 않는 것

- Slash command를 추가하지 않습니다.
- Codex plugin을 설치하지 않습니다.
- 백그라운드에서 자동 실행하지 않습니다.
- MCP 설정을 자동 등록하지 않습니다.
- Commit을 차단하지 않습니다.
- 다른 사람이 만든 스킬을 기본값으로 삭제하지 않습니다.

전체 명령어 설명은 [명령어 가이드](commands.ko.md)를 봅니다. 설치, 업데이트, 삭제와 npm 사용 흐름은 [사용 수명주기](lifecycle.ko.md)를 봅니다.
