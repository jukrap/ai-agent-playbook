# Worker Contract

Worker contract는 위임된 작업을 review 가능하게 만듭니다. 다른 agent가 전체 대화를 물려받지 않고도 실행할 수 있을 만큼 작아야 합니다.

## Required Fields

- `taskId`: worker assignment를 위한 안정적인 짧은 id.
- `goal`: 넓은 mission이 아니라 하나의 구체적인 outcome.
- `scope`: worker가 inspect할 수 있는 file, directory, doc, API, screen, dataset, command.
- `allowedWrites`: 정확한 path 또는 `none`. Research, review, evidence gathering은 기본값을 `none`으로 둡니다.
- `requiredReads`: claim 전 반드시 읽어야 하는 project docs, skills, recipes, maps, contracts, source area.
- `tools`: 허용된 CLI, MCP, browser, test, search, local analysis tool.
- `outputs`: 예상 report, patch, test, evidence envelope, review finding, handoff note.
- `evidence`: locator format, scan range, command output summary, screenshot path, report path, source registry item.
- `stopConditions`: missing evidence, conflicting instruction, unsafe write, private data risk, unclear owner, exceeded budget.
- `budget`: 필요 시 context, time, token, command, retry budget.

## Scope Rules

- 독립적으로 review 가능한 질문이나 patch 하나당 worker 하나를 선호합니다.
- Write permission 전에 각 worker에게 제한된 read set을 줍니다.
- 하나가 명시적 reviewer가 아니라면 두 write worker가 같은 file을 다루게 하지 않습니다.
- Project-relative path를 사용합니다. Public handoff에는 personal absolute path, private URL, branch name, PR number, credential, raw external excerpt를 피합니다.
- Reference adoption은 추상화합니다. Noisy source project label이 아니라 어떤 capability pattern을 채택했는지 기록합니다.

## Output Contract

각 worker output은 다음을 명시해야 합니다.

- 무엇을 inspect했는지,
- 무엇을 바꿨거나 무엇을 발견했는지,
- evidence locator와 scan range,
- 실제 실행한 verification command,
- skipped check와 이유,
- risk 또는 unresolved assumption,
- output이 ready, blocked, advisory-only, needs review 중 무엇인지.

## Stop Conditions

다음 상황에서는 계속하기 전에 멈추고 reconcile합니다.

- worker가 배정된 것보다 넓은 scope를 필요로 합니다.
- Write work가 ownership boundary를 넘습니다.
- Evidence를 다시 열 수 없습니다.
- Generated summary가 source file과 충돌합니다.
- Verification을 실행할 수 없는데 결과를 pass로 취급하려고 합니다.
- 여러 worker가 서로 충돌하는 fact를 보고합니다.
