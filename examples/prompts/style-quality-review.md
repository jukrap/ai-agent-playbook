# Style Quality Review Prompt

Use this prompt when reviewing style quality while preserving the current design intent.

```text
Review the current screen's style quality while preserving its existing functionality and design intent.

First inspect the repository structure, README, AGENTS.md, relevant local docs, and current git state.
Then find the related components and style files and classify issues by:

1. visible breakage or responsive problems
2. CSS/inline style conflicts, duplication, or cascade risk
3. direct implementations that should use shared UI/primitives
4. missing loading, empty, error, or disabled states
5. risk of changing the intended design too much

If changes are needed, make the smallest change that preserves visual intent.
If the project explicitly prefers inline styles, follow that policy.
Before completion, verify with the project's defined lint/test/build commands or rendered-screen checks using fresh output.
Do not commit local-only docs.
```
