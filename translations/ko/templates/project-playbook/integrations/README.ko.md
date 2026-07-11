# Integrations

MCP, adapter, hook, command 설정을 이곳에 둡니다.

쓰기 가능 integration은 runbook이 제한된 작업 범위로 활성화하기 전까지 비활성으로 유지합니다.

- `forge.example.json`: 검토한 `automation`, `forge`, `git`, `executor` section만 project config에 합칩니다. 이 예시는 의도적으로 kill switch를 켜 둡니다.
- `actions/`: GitHub와 Gitea용 preview-first single-tick workflow 예시입니다. 선택한 provider workflow만 복사하고 permission, secret, variable, runner support, 고정된 action revision을 먼저 검토합니다.

Token은 이 디렉터리에 저장하지 않습니다. Provider secret store 또는 승인된 local credential store를 사용합니다.

Self-hosted Gitea에서는 `forge.apiBaseUrl`로 custom port 또는 instance subpath를 선택할 수 있지만 hostname은 selected Git remote hostname과 같아야 합니다. Repository-controlled config가 forge token을 다른 host로 보내지 못하도록 cross-host API configuration은 authentication 전에 거부합니다.
