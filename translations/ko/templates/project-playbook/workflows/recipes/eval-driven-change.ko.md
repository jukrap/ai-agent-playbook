# Eval Driven Change

Inputs: target behavior, risk class, baseline, eval id, fixture scope, grader type, success criteria, retry budget, cost budget, latency budget, promotion path.

Outputs: eval definition, eval run report, pass fail summary, grader evidence, residual risk, follow-up issue, promotion decision.

Skills: eval harness design, test verification strategy, capability witness history, pre-action fact gate, runtime index cache design, git worklog guardrails.

Tools: `workflow run-preview`, `operator search`, `operator preflight`, `diagnostics check`, `index status`, `write-gate preview`, schema validation, test command, eval command when available.

Stop conditions: target behavior가 observable하지 않음, baseline 누락, grader가 wrong answer를 구분하지 못함, deterministic behavior에 deterministic grader 누락, retry policy가 failed attempt를 숨김, cost 또는 latency budget unknown, generated evidence가 review 없이 promote될 위험.

Verification: eval definition review, feasible한 deterministic grader 사용, run report를 runtime 아래 기록, failed attempt 보고, cost와 latency caveat 기록, residual risk 문서화, promotion path review.
