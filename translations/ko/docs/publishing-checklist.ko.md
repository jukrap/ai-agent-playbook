# 배포 점검표

Node와 Python은 모두 `1.0.0`을 사용합니다. 소스의 버전 표기만으로 레지스트리 게시를 확인한 것은 아닙니다. 게시 전에 정확한 압축 파일을 시험하고, 게시 후에는 레지스트리에서 받은 파일로 확인합니다.

## 릴리스 후보 준비

1. 브랜치, 커밋하지 않은 상태, 의도한 변경, 보존할 사용자 변경을 확인합니다.
2. `package.json`, `src/version.mjs`, Python 설정·버전, 변경 기록, 버전별 안내를 맞춥니다. 정식 `1.0.0` 전환은 의도적으로 결정해야 하며 태그 변경의 부수 효과로 진행하지 않습니다.
3. 동작·번역·공개 문서·래퍼 미리보기를 포함한 [유지보수 검사](maintenance.ko.md)를 실행합니다.
4. 격리된 폴더에서 초보자 실습과 바뀐 명령 예시를 따라 합니다. README 두 언어의 표현과 한국어 이해도를 검토합니다.
5. 압축 파일에 런타임, 선택 스킬, 참고 자료, 연결된 안내·예시·이미지가 있는지 봅니다. 개인 기록, 백업, 원시 로그, 시험 설치본, 종료된 실행 모듈은 제외합니다.

## 게시 전에 압축 파일 설치하기

```powershell
npm pack --dry-run --json
npm pack
npm install --prefix "<demo-prefix>" --ignore-scripts "<archive.tgz>"
node "<demo-prefix>/node_modules/ai-agent-playbook/bin/aapb.mjs" --version
node "<demo-prefix>/node_modules/ai-agent-playbook/bin/aapb.mjs" --help
```

새 설치 폴더를 사용하고 압축 파일의 체크섬을 기록합니다. 실수로 소스나 전역 명령을 실행하지 않도록 압축 파일에서 설치한 CLI를 사용하세요. 기록 조회, 범위를 지정한 스킬 설치, 해당하는 이전·복구, 실제 MCP stdio 연결을 확인합니다. 기존 프로젝트의 원본 기록은 보존하고 적용·복구는 복사본에서 시험할 수 있습니다. [시연 안내](demo.ko.md)를 참고하세요.

압축 파일 안의 Markdown 상대 링크와 HTML 이미지·링크 속성을 확인합니다. 문장에 적힌 실제 경로도 따로 봅니다. Git에 있는 README 이미지라도 배포 목록에서 제외되면 npm에는 없을 수 있습니다.

## 게시와 게시 후 확인

정확한 후보 파일과 게시가 허용된 뒤에 검증한 압축 파일을 게시합니다. 사전 릴리스는 `next` 태그를 사용하고 정식 `latest` 전환은 별도로 결정합니다.

```powershell
npm publish "<verified-archive.tgz>" --tag latest --dry-run
```

위 명령은 게시 미리보기입니다. 레지스트리 인증, 권한, 업로드 성공, 공개 상태를 확인한 것은 아닙니다. 실제 게시에는 `--dry-run`을 빼지만 압축 파일 생성에 성공했다는 이유만으로 진행하지 않습니다.

의도적으로 게시한 뒤에는 정확한 버전과 태그를 조회하고 새 폴더에 그 버전을 설치해 진입점을 다시 확인합니다. 게시, Git push·PR·병합, 로컬 설치는 따로 기록하세요. 패키지 설치가 스킬·MCP·훅을 자동 활성화해서는 안 됩니다.

## 같은 파일로 GitHub 릴리스 만들기

릴리스 변경을 병합한 뒤 검증한 소스 커밋을 확인합니다. GitHub와 npm에 같은 압축 파일과 체크섬 파일을 사용합니다. 다음 자리표시자를 검증한 파일로 바꾸세요.

```sh
gh release create v1.0.0 "<verified-archive.tgz>" "<checksum-file>" --target "<verified-commit>" --title "AI Agent Playbook 1.0.0" --notes-file "<release-notes.md>" --latest
```

태그가 없으면 명시한 커밋에 연결해 만듭니다. 태그가 이미 있으면 대상을 확인하고 기존 릴리스 태그를 옮기지 않습니다. 두 게시 결과를 각각 확인하세요. [GitHub CLI 릴리스 생성](https://cli.github.com/manual/gh_release_create)과 [npm 게시](https://docs.npmjs.com/cli/v10/commands/npm-publish/) 안내를 참고할 수 있습니다.

## 복구와 릴리스 안내

이전 전역 설치 버전이 소스 태그와 다르면 패키지를 별도로 보존합니다. 스킬 작업별 백업과 기록 구조 복구 파일도 남깁니다. 복구 순서와 해시 충돌 대응은 [설치 안내](lifecycle.ko.md)에 있습니다.

릴리스 안내에는 바뀐 명령·도구 이름, 종료된 기능과 버전 고정 복구, 영향받는 설치·기록 경로, 완료한 검사, 남은 한계를 적습니다. 개인 근거를 게시하거나 모의 원격 검사를 실제 쓰기 증거로 표현하지 않습니다. 영문·한국어 배포 안내를 함께 맞추세요.
