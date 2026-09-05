# Forge 협업

Forge는 GitHub나 Gitea 같은 협업 서비스를 뜻합니다. AAPB는 협업 변경을 계획하고 명시적으로 적용하며, 관리 항목의 식별자를 유지하고 충돌을 알려줍니다. 작업 실행, 예약, 소스 수정, 커밋, push는 하지 않습니다.

## 대상 원격 확인하기

```sh
aapb forge status "<project>" --json
aapb forge status "<project>" --remote origin --provider github --json
```

상태 조회는 로컬 Git 원격과 정책을 읽습니다. 서비스에 접속하거나 인증 정보를 검증하지 않습니다. `policyWrites`는 설정된 정책을 뜻합니다. 인증·권한 근거가 필요한 `verifiedWrites`를 이 값만으로 판단하면 안 됩니다. 자체 호스팅 서비스를 자동으로 구분하지 못하면 제공 서비스를 직접 지정하세요.

## 초기 협업 항목 미리보기

```sh
aapb forge bootstrap "<project>" --milestone "Example delivery" --json
```

원격 호출 없이 라벨과 지정한 마일스톤 작업을 미리 봅니다. `summary.planned`, `results`의 작업 식별자·대상 종류, 제공 서비스, 경고, 충돌을 확인하세요. `--project-title`과 `--project-mode`는 지원되는 프로젝트 표시 방식을 선택합니다. CLI 기본 모드는 `milestone`입니다. 호환성 기준에 이름이 있다고 실제 원격에서 모든 기능을 쓸 수 있다는 뜻은 아닙니다.

## 작은 계획 파일 예시

GitHub 예제로 아래 내용을 대상 프로젝트의 `docs/coordination.json`에 저장합니다. 라벨 작업 하나를 명시한 형식입니다. 적용 전에는 실제 의도에 맞게 바꾸고 검토하세요.

```json
{
  "provider": "github",
  "operations": [
    {
      "id": "label:docs-reviewed",
      "idempotencyKey": "example.label.docs-reviewed",
      "action": "ensure",
      "resource": "label",
      "capability": "labels",
      "payload": {
        "name": "docs-reviewed",
        "color": "1f883d",
        "description": "Documentation changes reviewed."
      }
    }
  ]
}
```

```sh
aapb forge sync "<project>" --plan docs/coordination.json --json
```

계획의 제공 서비스는 선택한 원격과 일치해야 합니다. 미리보기에서는 해당 작업이 예정 상태로 나옵니다. 기존 작업·협업 입력 형식도 받을 수 있습니다. 이 형식은 `planId`, 작업 목록, 공개용 요약·범위·제외 사항·성공 기준·작업 그룹이 담긴 `coordination` 객체를 사용합니다. 단일 서비스 작업보다 여러 작업 그룹을 조율할 때 적합합니다.

`forge reconcile`도 프로젝트 기준 상대 경로의 검토한 계획을 받아 표시 구조를 조정할 작업을 계획합니다. CLI 결과에는 전체 전송 내용 대신 작업 식별자·대상 종류·상태가 나옵니다. 입력 계획과 요약을 함께 검토하세요. 원격 작업 전체가 한꺼번에 성공하거나 취소된다는 보장은 아닙니다.

## 적용과 인증

계획을 검토한 뒤에만 적용 명령을 실행합니다.

```sh
aapb forge sync "<project>" --plan docs/coordination.json --apply --json
```

이 명령은 원격에 쓸 수 있습니다. CLI의 Forge 기본 프로필은 `coordinate`이며 스킬 프로필과 달리 원격 작업 권한을 정합니다. `off`, `observe`는 쓰기를 허용하지 않습니다. `deliver`, `release`는 PR 같은 추가 협업 항목을 허용하지만 이름만으로 소스 실행이나 게시를 시작하지 않습니다. 삭제와 강제 push는 계속 거부합니다. 기존 연결을 대체하는 작업에는 현재 CLI가 노출하지 않는 별도 승인 경로가 필요하며 일반 apply로 우회할 수 없습니다.

GitHub 인증은 `GH_TOKEN`, `GITHUB_TOKEN`, 해당 호스트의 GitHub CLI 로그인 순서로 찾습니다. Gitea는 서버와 OpenAPI 제공 여부를 확인한 뒤 `GITEA_TOKEN` 또는 `AAPB_FORGE_TOKEN`을 사용합니다. 인증 정보는 환경 변수나 자격 증명 관리 도구에 두고 계획에 적지 마세요. 미리보기는 인증 정보를 가져오지 않습니다.

`--offline`, `--no-remote`, `--remote-read-only`가 있으면 `--apply`를 붙여도 원격 쓰기를 하지 않습니다. 기존 예약이나 원격 기록을 자동으로 바꾸거나 삭제하지 않습니다.

## 중복·동시 변경·일부 실패 대응

관리 표식과 일정한 식별자를 사용해 반복 실행 시 기존 항목을 재사용합니다. 알려진 이슈를 갱신할 때는 `expectedUpdatedAt` 같은 예상 수정 시각을 유지합니다. 원격이 더 최근에 바뀌었다면 덮어쓰지 말고 충돌 내용을 검토하세요.

적용 후에는 작업별 결과를 읽습니다. 앞의 일부가 성공한 뒤 다음 작업이 실패할 수 있습니다. 성공한 식별자를 보관하고 현재 원격 상태를 확인한 뒤, 검토한 계획을 고쳐 의도한 나머지 작업을 재시도하세요. 로컬 프로젝트 진행은 보존합니다. 스킬·기록 복구는 원격 쓰기를 되돌리지 않습니다. 원격 복구는 별도로 검토한 서비스 작업입니다.

테스트는 모의 전송으로 재사용, 오래된 상태, 권한, 재시도, 일부 적용을 확인합니다. 실제 GitHub/Gitea 쓰기 성공을 증명하지는 않습니다. [검증 보고서](verification.ko.md)를 참고하세요. 과거 자동 전달·예약 명령은 종료했으며 버전 고정 복구는 [설치 안내](lifecycle.ko.md)에 있습니다.
