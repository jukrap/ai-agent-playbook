# Worklogs

Worklog는 상세 reasoning, blocker, verification, direction change를 보존합니다.

이 저장소에서 worklog와 월간 summary를 만들려면:

```powershell
node .\bin\ai-playbook.mjs worklog new <target-repo> --title "short-worklog-title"
node .\bin\ai-playbook.mjs worklog summarize <target-repo> --month YYYY-MM
```

## 배치

```text
worklogs/
  README.md
  YYYY-MM/
    YYYY-MM-DD-short-topic.md
  summaries/
    YYYY-MM.md
```

## Worklog를 쓰는 경우

- milestone completion
- blocker 또는 repeated failure
- major direction change
- useful cause analysis가 있는 long debugging
- API contract, deployment, native, printing, permission, data-shape changes

## 규칙

- 미래 agent가 context를 회복할 수 있을 만큼 자세히 씁니다.
- problem, decision path, evidence, verification, remaining risk를 설명합니다.
- 프로젝트가 worklog를 durable context로 사용한다면 commit-message-sized summary로 줄이지 않습니다.
- 계속 현재인 사실은 `../CURRENT.md`, `../maps/`, `../runbooks/`, `../decisions/`로 승격합니다.
- 상세 entry는 월별 폴더에 모으고, `summaries/`에는 월별 summary 하나를 유지합니다.
