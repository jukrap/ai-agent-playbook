# 게시 전 AAPB 패키지 시연

레지스트리에 먼저 게시할 필요는 없습니다. 압축 파일을 만들고 설치하면 중간 버전을 게시하지 않고도 배포 파일 목록·CLI 진입점·의존성을 확인할 수 있습니다. 나중에 의도적으로 게시할 수 있도록 검증한 압축 파일과 체크섬을 보관하세요.

## 격리된 압축 파일 설치

검증한 소스 checkout에서 npm pack을 실행합니다. 아래 압축 파일과 prefix 표시는 실제 값으로 바꿉니다. prefix는 기존 전역 설치 경로가 아닌 별도의 로컬 시연 디렉터리입니다.

```sh
npm pack
npm install --prefix <demo-prefix> --ignore-scripts <archive.tgz>
node <demo-prefix>/node_modules/ai-agent-playbook/bin/aapb.mjs --version
```

패키지 설치는 스킬을 설치하거나 MCP를 켜지 않습니다. 아래 예제는 압축 파일에 든 CLI로 실행합니다. 의도적으로 전역 설치했다면 확인한 aapb 실행 파일을 사용해도 됩니다.

## 기존 기록

```sh
aapb records status <project> --json
aapb records status <project> --view records --page-size 7 --json
aapb records read <project> --path CURRENT.md --max-chars 700 --json
aapb records search <project> --query <literal> --max-results 2 --json
aapb records validate <project> --page-size 4 --json
aapb migrate layout <project> --to minimal --json
```

읽기는 같은 경로와 nextCursor에서 받은 --cursor로 이어 갑니다. 목록은 page.nextCursor를 사용하고 보기·검색어를 반복합니다. 반환된 content를 구분자 없이 이어 붙여 원문과 비교하세요. UTF-8 BOM은 텍스트에서 제외하지만 SHA-256은 원래 바이트를 식별합니다. 위치와 문자 예산은 JavaScript UTF-16 단위이며 surrogate pair를 보존합니다.

매 페이지의 총수·원본 위치·경고·scan.complete를 확인합니다. managed-modified는 수정본 보존 표시이며 문장이나 제품 결함을 입증하지 않습니다. 이를 없애려고 원문을 다시 쓰지 마세요. 소유권 메타데이터가 없으면 레이아웃 이전을 정상적으로 거부할 수 있으며 기록 읽기는 계속 가능합니다.

적용·복구는 보존한 기록 복사본에서 시연합니다. 복구 후 복사한 원본 파일을 모두 확인하세요. 복구 archive는 의도적으로 남습니다. 제품 검사는 기록 검증과 구분하며, 기록 검증은 runtimeVerified를 true로 바꾸지 않습니다.

## MCP와 설치 정리

SDK stdio 클라이언트에서 임시 aapb mcp --project <project> 프로세스를 시작해 aapb_status, aapb_search, aapb_read, aapb_validate를 확인합니다. 공통 호스트 MCP 항목을 켤 필요는 없습니다. SDK 왕복 호출은 서버·전송 동작을 검증하며 모든 호스트의 표시 방식이나 토큰 계산을 검증하지는 않습니다.

설치 스킬 교체 전 skills migrate --profile development --dry-run --json으로 소유권·충돌을 확인합니다. 일반 업데이트는 선택한 관리 스킬만 대상으로 합니다. 깨끗한 재설치가 목적이면 선택한 프로필의 uninstall을 미리 본 뒤 적용하고, 반환된 백업을 보관한 채 검증한 압축 파일에서 프로필을 설치합니다. 수정본·미관리 스킬·다른 제품·비활성 플러그인 캐시·복구 archive는 보존합니다.
