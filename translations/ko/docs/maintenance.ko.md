# 유지보수

관련 지침·현재 소스·작업 트리 상태를 확인합니다. 영어를 기준으로 같은 변경에서 한국어 번역을 갱신합니다. 설치용 SKILL.md는 skills/<category>/<name>에만 두며 frontmatter에는 name과 Use when으로 시작하는 사용 조건 description만 포함합니다.

짧은 스킬 진입점과 과제별 참조를 유지합니다. 복사 가능한 정책은 templates/agents, 기록은 templates/project-playbook에 둡니다. 선택 참조 라이브러리를 자동 읽기 목록으로 만들지 않으며 설치본은 이 저장소에서만 동기화합니다.

## 검사

논리적으로 묶인 변경 뒤 다음을 실행합니다.

```sh
npm run check
npm run typecheck
npm test
npm run validate:python
npm run validate:all
```

Windows 래퍼도 확인합니다.

```powershell
.\scripts\sync-skills.ps1 -WhatIf
.\install.ps1 -SkipValidation -WhatIf
.\update.ps1 -SkipValidation -WhatIf
```

실제 동기화에서는 프로필을 선택합니다. 구버전 중복은 이전 미리보기를 먼저 확인합니다. 문단마다 전체 검사를 반복하지 않으며 새 동작·실패에 해당하는 검사만 다시 수행합니다.

## 런타임과 산출물

Node ESM 진입점과 aapb를 유지합니다. 데이터 경계·덮어쓰기·이전·복구·공개 명령 변경에는 의미 있는 회귀 검증을 추가합니다. npm pack 내용과 prerelease 설치를 확인합니다. Python은 PEP 440을 사용하며 npm next.N을 devN으로 대응합니다.

실패를 감추기 위해 공개 문서·번역 검사를 약화하지 않습니다. 개인 경로·자격 증명·로컬 기록·원시 근거를 공개 산출물에 넣지 않습니다. 검증 동작을 바꾸면 CI도 갱신합니다.

Conventional Commit type/scope와 사용자 작업 언어를 사용하고 중요한 변경에는 본문과 실제 검증을 적습니다. 관련 경로만 명시적으로 stage하고 훅을 우회하거나 로컬 기록을 포함하지 않습니다. 원격 게시는 로컬 커밋과 별개입니다.
