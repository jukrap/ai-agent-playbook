# Integrations

MCP, adapters, hooks, and command configuration live here.

Write-capable integrations should stay disabled until a runbook enables them for a bounded task.

- `forge.example.json`: merge only the reviewed `automation`, `forge`, `git`, and `executor` sections into project config. It intentionally keeps the kill switch enabled.
- `actions/`: preview-first GitHub and Gitea single-tick workflow examples. Copy only the selected provider workflow and review permissions, secrets, variables, runner support, and pinned actions first.

Do not store tokens in this directory. Use the provider secret store or an approved local credential store.

For self-hosted Gitea, `forge.apiBaseUrl` may select a custom port or instance subpath but its hostname must match the selected Git remote hostname. Cross-host API configuration is rejected before authentication so repository-controlled config cannot redirect a forge token.
