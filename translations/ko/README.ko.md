# AI Agent Playbook

이식 가능한 프로젝트 기록, 선택형 산출물 스킬, 프로젝트 도구를 제공합니다.

## 1.0에서 달라지는 점

CURRENT.md 하나에서 시작하고 과제에 필요한 스킬만 선택하며 지속적인 상태는 일반 파일로 남깁니다. 모든 편집에 계획·테스트·승인·작업 로그 절차를 강제하지 않습니다.

- 코어: project-memory, spec-artifacts
- 개발: 코어에 design-brief-direction, ui-polish, natural-writing-humanization 추가
- 선택: 필요한 기술 참조를 포함한 legacy-contracts
- 프로젝트 MCP: 명시적으로 설정한 프로젝트에서 네 가지 읽기 전용 기록 도구 제공
- Forge: 명시적인 GitHub/Gitea 협업 동기화 유지, 실행·예약은 호스트 기능 사용

패키지명 ai-agent-playbook과 aapb 명령을 유지합니다. 소스 버전은 prerelease이며 metadata 변경은 npm 게시를 의미하지 않습니다.

## 소스 checkout에서 사용

Node.js 18 이상이 필요합니다. 개발 검사는 저장소 도구를 사용하며 글쓰기 분석용 Python 3.11 이상은 선택 사항입니다.

```sh
npm install --no-package-lock
node bin/aapb.mjs --help
node bin/aapb.mjs skills install --profile development --dry-run
node bin/aapb.mjs skills install --profile development
node bin/aapb.mjs bootstrap <project> --local-only --dry-run
node bin/aapb.mjs bootstrap <project> --local-only
node bin/aapb.mjs records status <project> --json
```

꺾쇠 표시를 실제 대상으로 바꿉니다. npm 패키지 설치만으로 스킬 설치·MCP 등록·프로젝트 변경은 하지 않습니다. 로컬 prerelease는 npm pack 결과를 격리된 prefix에 설치해 검증한 뒤 기존 설치를 교체합니다.

## 0.5에서 이전

기본 스킬 경로는 .agents/skills입니다. 일반 update는 기존 중복을 자동 삭제하지 않습니다.

```sh
aapb skills migrate --profile development --dry-run --json
aapb skills migrate --profile development --apply --json
aapb skills rollback --backup <transaction-directory> --json
aapb skills rollback --backup <transaction-directory> --apply --json
```

수정본과 미관리 파일은 보존하고 충돌을 보고합니다. 설정 변경 후에는 새 호스트 로딩에서 실제 노출을 확인해야 합니다. 자세한 내용은 lifecycle 가이드를 확인합니다.

## 안내

명령, 기록 구조·호환성, MCP 경계, 스킬 목록·전수 판정, 디자인·글쓰기, Forge 협업, 설계 근거와 선택 참조 라이브러리는 대응하는 docs 문서를 참고합니다. 라이선스는 MIT입니다.
