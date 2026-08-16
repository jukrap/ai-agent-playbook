# Forge 자동화와 재개 가능한 작업 전달

AI Agent Playbook은 로컬 실행 원장과 GitHub 또는 Gitea 협업 화면에 서로 다른 종류의 사실을 둡니다. 이 문서는 현재 계약을 설명합니다. 배포 이력은 `CHANGELOG.md`에 둡니다.

## 역할 분리

- 로컬 원장은 작업 상태, 시도, lease, checkpoint, 검증 근거, 재개 사실을 관리합니다.
- 이슈는 기본적으로 내부 작업마다 하나씩 만들지 않고, 로드맵과 독립적으로 검토 가능한 delivery group을 나타냅니다.
- GitHub Projects와 Views는 상태, 우선순위, 위험도, 단계, 진행률을 보여줍니다. Gitea에 동등한 안정 API가 없으면 milestone과 상태 label을 사용합니다.
- Milestone은 release 또는 program 완료율을 추적합니다.
- Pull request는 실제 코드 변경, 검증, 위험, rollback, 남은 작업을 담습니다.

승인된 구조화 plan은 세밀한 작업 ID를 유지하면서 상위 로드맵 하나와 소수의 delivery-group 이슈만 공개할 수 있습니다. 기존 이슈는 명시적 ready 승인을 거쳐야 실행 queue에 들어갑니다. 공개 제목과 본문은 사람을 위한 표시 계약이며 직렬화된 runtime 데이터베이스가 아닙니다.

## 실행 모델

`automation start`는 승인 plan에서 run을 만듭니다. `automation tick`은 준비된 작업을 최대 하나 claim하고 worker를 호출합니다. 이어서 controller가 프로젝트 검증을 다시 실행하고, 허용된 Git 변경을 전달하고, Forge 상태를 동기화하고, checkpoint를 기록합니다. `automation supervise`는 설정한 작업·재시도·정체·전체 시간 예산 안에서 짧은 tick을 반복합니다.

추가 전용 원장은 프로세스가 재시작되어도 유지됩니다. 갱신 가능한 lease, heartbeat, fencing token, provider concurrency group은 오래되거나 중복된 controller가 유효한 상태를 쓰지 못하게 합니다. 검토 후 재시도 예산은 초기화할 수 있지만 attempt serial은 감소하거나 이전 event ID를 재사용하지 않습니다.

대화형 작업은 현재 checkout의 task branch를 사용하면서 관련 없는 dirty path를 보존합니다. 무인 작업은 commit된 Git 기준선에서 만든 관리형 격리 checkout을 사용합니다. Worker에는 Forge token, push credential, credential helper, 대화형 Git 인증을 전달하지 않습니다. Controller가 변경 파일을 검토하고 검증을 다시 실행하고 명시적 path만 stage해 전달합니다.

## 사람이 보는 협업 구조

일반적인 이슈 mode는 로드맵 하나와 delivery-group 이슈입니다. 관리되는 한국어 제목은 문장을 기계적으로 바꾸지 않고 검토된 명사형으로 작성합니다. 관리 본문에는 범위, 제외 범위, 결과물, 수용 기준, 의존성, 검증, 위험, rollback, 진행률, 현재 gate, 다음 행동, 관련 pull request를 담습니다. Marker 밖의 사용자 글은 보존합니다.

GitHub Projects를 사용할 수 있으면 `Delivery Status`, `Priority`, `Risk`, `Phase`, `Progress`, `Area`, `Task ID` 같은 중립적인 field를 사용합니다. 기존 tool prefix field는 읽기 호환 alias로 유지하고 파괴적인 rename이나 삭제 없이 재사용합니다. Project가 표시 상태를 관리하는 새 저장소에서는 명시적 실행 승인용 `status:ready` label만 기본으로 사용합니다.

## 권한과 provider capability

권한 profile은 `off`, `observe`, `coordinate`, `deliver`, `release`입니다. 기본 `deliver`는 issue와 project metadata를 조율하고 branch, 명시적 commit, push, draft pull request를 만들 수 있습니다. Merge, release, delete, force-push, protected branch 변경은 계속 승인이 필요하며 `release`도 delete와 force-push를 자동 허용하지 않습니다.

`forge status`는 설정상 정책과 검증된 인증·저장소 권한을 분리합니다. GitHub Projects 권한이 없으면 첫 변경 전에 Project 협업을 중단하고 다음 복구 명령을 안내합니다.

```powershell
gh auth refresh -s project
aapb forge status .
```

하네스는 인증 scope를 자동으로 확대하지 않습니다. Projects 권한을 원하지 않는 운영자는 문서화된 Projects/Views capability fallback을 명시적으로 승인해야 합니다.

Gitea 지원은 capability 기반입니다. 인증된 쓰기 전에 version과 OpenAPI를 검사하고, 광고된 공개 issue, label, milestone, pull-request, Actions method만 사용합니다. 확정할 수 없는 self-hosted provider는 provider와 API base를 설정하고 Git remote host와 일치시킬 때까지 쓰기 불가 상태로 둡니다.

## Reconcile과 복구

Forge bootstrap, sync, reconcile, scheduler 설치는 미리보기 우선입니다. 적용은 검토한 `updatedAt` snapshot과 compare-and-swap 검사를 사용합니다. Provider가 재사용 가능하다고 확인한 operation은 다시 쓰지 않고 no-op으로 보고합니다.

GitHub는 새 Project에 system 기본 View를 만듭니다. Adapter는 table View를 중복 생성하지 않고 이 View를 관리 대상 전체 항목 화면으로 재사용합니다. 공개 API는 system View의 rename이나 delete를 지원하지 않으므로 하네스는 표시 이름이 바뀌었다고 주장하지 않습니다.

검토된 기존 구조 통합은 survivor 이슈를 재사용하고 승인된 오래된 이슈를 닫고 Project card와 native sub-issue 관계를 정리할 수 있습니다. 이슈나 label 정의는 삭제하지 않습니다. 실패한 상태를 다음 preview가 다시 발견할 수 있는 순서로 실행합니다. 이미 연결이 해제된 열린 이슈를 복구하려면 승인 plan과 정확히 일치하는 supersede marker가 필요합니다. 소유권이 모호하면 쓰기를 중단합니다.

Git 전달은 Forge sync보다 먼저 checkpoint에 기록합니다. Commit이나 push 뒤에 controller가 중단되어도 worker를 다시 실행하거나 commit을 중복 생성하지 않고 sync부터 재개합니다. 진행 중 remote 요구사항이 바뀌면 새 지시를 조용히 채택하지 않고 reconcile을 위해 run을 멈춥니다.

## Hosted workflow와 로컬 fallback

생성된 GitHub Actions와 Gitea Actions workflow는 자신을 생성한 AAPB package release를 고정합니다. 이미 복사된 workflow는 자동으로 덮어쓰지 않으므로 새 schedule preview를 검토한 뒤 start와 tick package pin을 갱신합니다. 외부 Action은 계속 전체 commit SHA로 고정합니다.

사용할 수 있는 remote가 없거나 `--no-remote`, `--offline`으로 요청 범위를 좁히면 controller는 Forge transport를 호출하지 않고 로컬에서 계속합니다. 인증이나 쓰기 권한이 없으면 변경은 비활성화합니다. 안전한 capability probe나 허용된 읽기는 유지할 수 있습니다.

Pause, stop, kill switch, 요청 단위 deny 설정은 언제든 자동화 범위를 줄일 수 있습니다. 자동화를 끈다고 이미 생성된 issue, branch, pull request, comment, schedule 같은 원격 효과가 삭제되지는 않습니다.

## 검증 경계

Provider contract fake, 로컬 scheduler preview, 저장소 테스트는 원격 부작용 없이 결정적 동작을 검증합니다. GitHub 또는 Gitea 쓰기 경로는 필요한 권한을 가진 disposable 저장소에서 실제로 실행했을 때만 원격 검증으로 판단합니다. CI 성공은 확인한 명령이 통과했다는 뜻이며 제품 완료나 시각 품질을 단독으로 증명하지 않습니다.
