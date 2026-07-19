# Hosted Runtime 버전 정렬 0.5.10

0.5.10은 hosted automation이 workflow를 생성하거나 제공한 AAPB package보다 오래된 release를 조용히 실행하는 문제를 방지합니다.

## 변경 사항

- GitHub Actions와 Gitea Actions generator는 하나의 runtime version module을 통해 `package.json`에서 정확한 `ai-agent-playbook` package pin을 가져옵니다.
- 복사 가능한 hosted workflow template도 같은 release pin을 제공하고, test는 모든 start와 tick command의 버전 불일치를 검사합니다.
- Forge REST request의 `User-Agent`는 오래된 hard-coded 값 대신 같은 package metadata를 사용합니다.

## 업그레이드와 안전성

- Schedule 생성은 계속 preview-first이며 그 자체로 automation을 활성화하지 않습니다.
- Project에 이미 복사된 내용이 다른 workflow는 계속 보존합니다. 생성 preview 또는 현재 release template을 검토한 뒤 AAPB package pin 두 곳만 갱신합니다. Scheduler가 해당 파일을 자동으로 덮어쓰지 않습니다.
- 기존 run ledger, plan, checkpoint, permission, repository variable, kill switch 설정은 migration할 필요가 없습니다.
- External Action은 계속 full commit SHA로 고정합니다. 이번 변경은 start와 tick command가 사용하는 AAPB npm package specifier에만 적용됩니다.

## 검증 초점

- 생성된 GitHub/Gitea workflow가 `automation start`와 `automation tick` 모두에 현재 package version을 사용합니다.
- 영문/한국어 복사 template이 같은 release pin을 가집니다.
- Forge request가 호출자가 지정한 header를 바꾸지 않으면서 현재 package version을 보고합니다.
