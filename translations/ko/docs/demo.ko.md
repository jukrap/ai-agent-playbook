# npm 게시 전에 로컬 패키지 시험하기

npm이 배포할 파일을 시험하는 데 레지스트리 업로드는 필요하지 않습니다. 검증한 소스에서 압축 파일을 만들고 새 폴더에 설치한 뒤, 그 설치본을 직접 실행합니다. 나중에 정확한 파일을 릴리스 대상으로 판단할 수 있도록 체크섬과 결과를 보관하세요.

## 1. 별도 폴더에 설치하기

AAPB 소스에서 `npm pack`을 실행합니다. 아래 자리표시자를 새 시연 폴더와 생성된 압축 파일 경로로 바꿉니다. PowerShell 변수는 현재 터미널 세션에서만 사용합니다.

```powershell
npm pack
$demoPrefix = '<absolute-demo-prefix>'
$demoArchive = '<absolute-archive.tgz>'
npm install --prefix $demoPrefix --ignore-scripts $demoArchive
$demoCli = Join-Path $demoPrefix 'node_modules/ai-agent-playbook/bin/aapb.mjs'
node $demoCli --version
node $demoCli --help
```

설치된 버전을 체크아웃의 package.json과 대조합니다. 현재 소스는 `1.2.2`입니다. 레지스트리 태그는 게시된 패키지를 가리키며 소스 버전 변경을 자동으로 따라가지 않습니다. 원하는 릴리스가 레지스트리에 올라가기 전에는 검증한 로컬 압축 파일이나 소스의 `node bin/aapb.mjs`로 실행하세요. 패키지 설치는 사용자 스킬을 설치하거나 MCP를 켜지 않습니다. 이후에는 모두 `node $demoCli`를 사용해 다른 전역 버전을 실수로 실행하지 않도록 합니다. 다른 셸에서는 설치된 스크립트의 절대 경로로 실행하세요.

## 2. 기존 프로젝트를 바꾸지 않고 확인하기

대상 프로젝트를 정하고 최초 Git 상태와 기록 파일 해시를 프로젝트에서 허용한 로컬 근거 위치에 보관합니다. 개인 경로와 원시 보고서는 공개 배포 파일에 넣지 않습니다.

```powershell
$demoProject = '<absolute-project-directory>'
node $demoCli records status $demoProject --json
node $demoCli records status $demoProject --view records --page-size 7 --json
node $demoCli records read $demoProject --path CURRENT.md --max-chars 700 --json
node $demoCli records search $demoProject --query '<phrase-in-the-records>' --max-results 2 --json
node $demoCli records validate $demoProject --page-size 4 --json
node $demoCli migrate layout $demoProject --to minimal --json
```

시작 문서, 총수, 원본 위치, 경고, `scan.complete`를 확인합니다. 작은 읽기 크기는 이어 읽기를 시험하기 위한 것입니다. 모든 일반 호출에 이 크기를 권장하는 것은 아닙니다. [응답 크기 안내](record-responses.ko.md)처럼 읽기는 `nextCursor`, 목록은 `page.nextCursor`를 사용합니다.

읽기 결과의 `content`를 구분자 없이 이어 붙여 원문과 비교합니다. UTF-8 BOM은 텍스트 출력에서만 빠지고 해시는 원본 바이트를 식별합니다. `managed-modified`는 검토할 수정본이 있다는 표시이며 문장 결함이 아닙니다. 소유권이 없으면 읽기는 가능해도 이전은 정상적으로 거부될 수 있습니다.

읽기·미리보기 후 원본 해시와 Git 상태를 다시 확인합니다. 애플리케이션 동작까지 시연 범위라면 프로젝트의 lint·test·build를 별도로 실행하세요. 기록 검증은 `runtimeVerified`를 true로 바꾸지 않습니다.

## 3. 보존한 복사본으로 이전 시험하기

적용·복구는 별도 프로젝트 폴더에 복사한 기록으로 시험하고 원본은 그대로 둡니다. 복사본을 미리 본 뒤 소유권 검사에서 허용할 때만 적용합니다. 반환된 상대 백업 경로를 보관하고 복구도 미리보기 후 적용하세요. 이후 원래 복사한 모든 기록을 대조합니다. 복구 파일은 의도적으로 남습니다.

관리 정보가 수정되었거나 소유권이 불명확해 거부되면 그 결과를 기록하고 읽기를 계속합니다. 성공한 시연을 만들려고 소유권을 만들어 넣지 마세요. 정확한 명령은 [설치 안내](lifecycle.ko.md)에 있습니다.

## 4. MCP와 선택한 설치 시험하기

SDK stdio 클라이언트나 사용하는 앱에서 설치된 스크립트에 `mcp --project <project>`를 넘겨 실행합니다. `aapb_status`, `aapb_search`, `aapb_read`, `aapb_validate` 목록과 호출을 확인하고, 본문과 원본 파일 무변경을 대조하세요. SDK 왕복 호출은 서버·통신을 검증하며 모든 앱의 표시·토큰 계산까지 검증하지는 않습니다. 일시적인 SDK 시험에는 공통 MCP 설정을 켤 필요가 없습니다.

스킬 관리 시험에는 실제 설치본과 분리된 설치 위치와 구버전 위치를 사용합니다.

```powershell
node $demoCli skills install --profile development --agents-root '<demo-skills>' --codex-root '<empty-legacy-root>' --dry-run --json
```

`--dry-run`을 빼서 적용한 뒤 같은 선택으로 점검·삭제하고 반환된 백업으로 복구합니다. 백업은 두 설치 폴더 밖이면서 같은 파일시스템에 둡니다. 일부 실패와 최신 작업부터 되돌리는 순서는 [설치 안내](lifecycle.ko.md)를 보세요.

## 작업 공간과 기록 작성 실습

새 일회용 작업 공간에 `apps/web`, `services/api` 같은 구성원 폴더를 준비합니다. 해당 작업 공간을 CLI 프로젝트 경로로 넘기고 실제 저장소는 읽기 전용으로 보존하세요. 작업 공간 루트에서 설치 명령을 쓰면 다음과 같습니다.

```sh
ai-agent-playbook bootstrap --kind workspace --repo-path apps/web --repo-path services/api --records standard --exclude none --agents link --dry-run --json
ai-agent-playbook bootstrap --kind workspace --repo-path apps/web --repo-path services/api --records standard --exclude none --agents link --json
ai-agent-playbook records status --view repositories --json
ai-agent-playbook worklog new --title "Workspace setup" --topic setup --repo web --lang ko --json
ai-agent-playbook knowledge new --title "Workspace contract" --topic setup --repo web --lang ko --json
ai-agent-playbook worklog list --repo web --topic setup --page-size 5 --json
ai-agent-playbook records search --query "Workspace" --repo web --kind knowledge --json
```

위 PowerShell 세션에서는 `ai-agent-playbook` 대신 `node $demoCli`를 사용하고 일회용 작업 공간 경로를 넣습니다. 실제 결과로 생성한 기록을 채우세요. 등록된 구성원에서 상태를 다시 조회해 공통 기록을 찾는지 확인하고 미등록 형제 폴더와 비교합니다. 구성원에 과거 기록이 있다면 `--record-source repo:web`로 읽고 바이트가 보존됐는지 확인합니다.

일회용 구성원 폴더에서 `workspace add/remove`의 미리보기와 적용을 시험하고 반환된 등록 백업을 보관합니다. 작업 공간 루트에서 `--repo` 없는 AST·Forge가 거부되는지 확인한 뒤 한 구성원을 선택해 읽기 전용 AST나 Forge 상태를 확인하세요. 지원하는 AST 언어만 사용하고 이 실습에서 원격 쓰기는 하지 않습니다.

제외 검증에는 일회용 Git 저장소를 사용하고 전역 제외를 시험한다면 별도 테스트 Git 환경을 준비합니다. local/shared/none 전환을 미리 보고 무관한 규칙과 추적 파일을 보존하며, `migrate bootstrap-rollback --backup "<returned-journal>"`의 미리보기와 `--apply`로 복구를 확인합니다. 시연을 위해 실제 사용자의 전역 제외를 바꾸지 않습니다. Git 없는 기록 생성과 로컬 제외를 건너뛰는 경고도 확인합니다.

대화형 터미널에서는 안내, 최종 검토, 취소와 `--yes`를 확인합니다. 비대화형 입력에서는 명시적 기본값과 `--json`이 질문하지 않는지 확인하세요. 질문 콜백을 주입하거나 CLI 도움말을 읽는 것만으로 실제 터미널 사용성을 검증한 것은 아닙니다. 실행하지 못한 경로를 기록하고 후보 전체가 통과했다고 보고하지 않습니다.

## 5. 실제 확인 범위 보고하기

패키지 버전·체크섬, 운영체제·Node 버전, 실행 명령·종료 코드, 보존 검사, 실제 MCP 호출, 한계를 기록합니다. 준비된 입력·복사본 검사와 원본 프로젝트 결과, 앱 로딩과 파일 설치를 구분하세요.

나중에 실제 사용자 스킬을 깨끗하게 재설치하려면 구버전 이전을 먼저 미리 봅니다. 선택한 항목을 삭제·재설치할 때도 백업을 남기고 수정본·미관리 파일·다른 제품·비활성 캐시·사용자 설정을 보존합니다. 시연 성공은 릴리스 판단의 근거이며 npm 게시 완료가 아닙니다.
