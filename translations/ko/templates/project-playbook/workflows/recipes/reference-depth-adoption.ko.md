# 레퍼런스 깊이 채택

Local reference collection을 감사한 뒤 skill, reference, workflow, MCP surface, validator를 보강할 때 사용합니다.

## 입력

- 프로젝트가 정한 로컬 레퍼런스 디렉터리.
- Target capability 또는 broad audit scope.
- Current skill catalog와 project playbook layout.
- 커밋에서 제외되는 로컬 전용 감사 작업공간.

## 산출물

- Local-only project audit note와 adoption ledger.
- 정제된 공개 변경만 skill reference와 workflow recipe와 docs와 validator와 MCP read surface에 반영합니다.
- Local-only audit material이 commit되지 않았음을 보여주는 verification summary.

## 읽을 스킬

- `skill-pack-governance`
- `agent-skill-authoring`
- `knowledge-source-registry`
- Adoption 대상 capability skill. 예: backend change safety, security review, design reference analysis, boundary review, deployment release check.

## 유용한 도구

- ai-playbook reference inventory <reference-dir> --json
- ai-playbook reference adoption-queue <reference-dir> --json
- ai-playbook reference capability-matrix <reference-dir> --json
- ai-playbook reference adoption-plan <reference-dir> --capability <capability> --json
- Ledger가 있으면 ai-playbook reference ledger-check <target> --path <ledger> --json

## 절차

1. 레퍼런스 원천과 감사 작업공간이 무시되거나 로컬 전용인지 확인합니다.
2. 모든 reference project에 대해 local audit note를 생성하거나 갱신합니다.
3. Local ledger에 `reviewed`, `adopted`, `deferred`, `rejected` 상태를 기록합니다.
4. Reusable practice를 local capability language로 정제합니다.
5. 정제된 결과만 committed file에 추가합니다.
6. `SKILL.md`는 trigger 중심으로 유지하고 자세한 절차는 `references/`에 둡니다.
7. English source 변경과 함께 Korean translation을 갱신합니다.
8. 원문 발췌, 로컬 경로, 비밀값, 로컬 감사 파일이 staged되지 않았는지 확인합니다.

## 중단 조건

- Reference license 또는 attribution 요구사항이 불명확합니다.
- 유용한 pattern을 source-specific implementation detail에서 분리할 수 없습니다.
- Adoption이 긴 upstream prose를 default prompt context로 복사하게 됩니다.
- Audit 중 personal path나 internal URL이나 credential이나 token-like value가 안전하게 요약될 수 없습니다.

## 검증

- git status --short에 로컬 레퍼런스 원천이나 감사 작업공간 파일이 staged되어 있지 않습니다.
- Public docs와 skills는 source project name이나 raw excerpt 대신 distilled capability guidance만 담습니다.
- npm run check
- npm test
- .\scripts\validate-skills.ps1
- .\scripts\validate-translations.ps1
- .\scripts\validate-public-docs.ps1
- git diff --check
