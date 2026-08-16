# Runtime Engines and Portability

AI Agent Playbook uses Node.js as the stable CLI and MCP facade and keeps Python as an optional local analysis engine. The number of files in each language is not a capability target.

## Why Node.js is the primary runtime

The npm package, `aapb` executable, MCP server, bootstrap lifecycle, Git and Forge adapters, scheduler, and automation controller must work from one cross-platform installation. These contracts stay in the Node runtime so normal project setup and coordination do not require a second language environment.

Node-backed commands remain available when Python is missing. The runtime favors deterministic filesystem and process contracts and keeps network and write permissions explicit.

## Where Python fits

Python 3.11+ is recommended for heavier local language analysis. The current optional engine contributes Korean and English prose signals to `writing naturalness-check` and `writing naturalness-report`. Libraries such as `kss` or `kiwipiepy` are used when installed and skipped otherwise.

Interpreter detection checks `AI_AGENT_PLAYBOOK_PYTHON`, a repository-local `.venv`, `python`, `python3`, and Windows `py -3` in order. Each candidate is probed inside its own process boundary, so a broken platform alias does not hide a later working interpreter. The JSON result records used and unavailable engines without turning missing Python into a harness failure.

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python -m pip install -U pip kss kiwipiepy
$env:AI_AGENT_PLAYBOOK_PYTHON = ".\.venv\Scripts\python.exe"
aapb runtime python-status --json
```

## When to add more Python

A new Python capability should provide a measurable benefit that is difficult to keep reliable in the portable Node path. Examples include mature linguistic tokenization, statistical analysis, or a specialized local library. It must remain local, bounded, testable, and optional unless the public installation contract changes. It must also return a clear unavailable-engine result.

Repository-specific build scripts are not evidence that this harness needs equivalent scripts. A reviewed writing reference contains separate programs for taxonomy-derived documents, long-document chunk preparation and reassembly, release-image generation, and domain-specific rewrite gates. Those programs depend on that product's content taxonomy, golden corpus, workflow directories, fonts, and publishing assets. Copying them would add product coupling rather than reusable development capability.

The broadly useful principles—deterministic before/after comparison, protected numbers and identifiers, sentence-touch evidence, register review, and rhetoric-preservation review—are represented in the playbook's quality commands. Domain-specific fixed rewrite thresholds and author-style scoring are intentionally not adopted. `writing fidelity-check` reports evidence instead of automatically rejecting an edit by percentage.

## Hosted runtime alignment

Generated GitHub Actions and Gitea Actions workflows derive their exact `ai-agent-playbook` package pin from the package release metadata. Forge requests use the same version in their request identity. Existing copied workflows are preserved and must be updated only after reviewing a fresh schedule preview or current template.

External workflow actions remain pinned by full commit SHA. Existing run ledgers, plans, checkpoints, permissions, repository variables, and kill switches do not depend on which optional Python interpreter is selected.
