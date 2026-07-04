# Eval Driven Change

Inputs: target behavior, risk class, baseline, eval id, fixture scope, grader type, success criteria, retry budget, cost budget, latency budget, promotion path.

Outputs: eval definition, eval run report, pass fail summary, grader evidence, residual risk, follow-up issues, promotion decision.

Skills: eval harness design, test verification strategy, capability witness history, pre-action fact gate, runtime index cache design, git worklog guardrails.

Tools: `workflow run-preview`, `operator search`, `operator preflight`, `diagnostics check`, `index status`, `write-gate preview`, schema validation, test command, eval command when available.

Stop conditions: target behavior is not observable, baseline is missing, grader cannot distinguish wrong answers, deterministic grader is missing for deterministic behavior, retry policy hides failed attempts, cost or latency budget is unknown, generated evidence would be promoted without review.

Verification: eval definition reviewed, deterministic grader used when feasible, run report recorded under runtime, failed attempts reported, cost and latency caveats recorded, residual risk documented, promotion path reviewed.
