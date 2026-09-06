# Node and optional Python

Node.js runs the CLI and MCP server. Python is optional for additional Korean/English writing signals. Neither record inspection nor JavaScript writing checks requires a model API or a new service.

## Required and optional parts

| Part | Requirement | Purpose |
| --- | --- | --- |
| Node.js | `18+` | CLI, MCP, installation, and JavaScript checks |
| npm | Supplied with a normal Node installation | Install package dependencies and archives |
| Python | Optional `3.11+` | Additional writing analysis |
| `kss`, `kiwipiepy` | Optional Python `ko` extras | Korean language analysis capabilities |
| TypeScript | Development dependency | Source checking, not a runtime analysis service |

The public minimum and a version actually tested are different claims. See [Verification](verification.md) for exercised versions. Read-only [AST search](ast-search.md) uses optional `@ast-grep/napi`, loaded only when called. Normal npm installs include optional dependencies; `--omit=optional` leaves record tools usable without this parser. Retired image-diff commands do not bring PNG-diff dependencies.

## Start with JavaScript

```powershell
ai-agent-playbook writing naturalness-check "<project>" --path README.md --lang auto --engine js --json
```

The CLI defaults to `js`. `--engine auto` and `--engine python` both request optional Python discovery in the retained writing implementation. If Python cannot run, the result keeps JavaScript findings and reports the unavailable engine. Inspect `engines.requested`, `engines.used`, `engines.unavailable`, and warnings; do not assume requesting Python proves it ran.

## Set up Python from a checkout

The PowerShell helper creates `.venv` and installs the optional extras:

```powershell
.\scripts\bootstrap-python.ps1
node bin/aapb.mjs runtime python-status --json
```

A manual cross-platform setup uses the checkout's Python package metadata:

```sh
python -m venv .venv
.venv/bin/python -m pip install -e '.[ko]'
node bin/aapb.mjs runtime python-status --json
```

On Windows, use `.venv/Scripts/python.exe` in place of `.venv/bin/python`. Choose a Python 3.11+ executable explicitly if `python` points elsewhere. The npm archive bundles the Python engine source; installing Node dependencies does not install optional Python libraries.

## Select a particular interpreter

For a session in PowerShell, set an explicit interpreter if needed:

```powershell
$env:AI_AGENT_PLAYBOOK_PYTHON = '"<absolute-python-executable>"'
ai-agent-playbook runtime python-status --json
```

Replace the placeholder and keep the inner quotes when the path contains spaces. Discovery checks the explicit environment setting, the package checkout's `.venv`, then available `python`, `python3`, and `py -3` candidates. The virtual environment belongs to the package/checkout, not automatically to the target project.

Each probe is bounded at eight seconds. `python-status` reports the selected interpreter and candidate errors. A timeout may mean a slow or broken startup; it does not prove Python is uninstalled. Check the reported command and engine import error before changing settings.

## Versions and validation

The stable Node package and Python engine both use `1.0.0`. For a future prerelease, npm `next.N` maps to Python's PEP 440 `devN`. For development, run `npm run validate:python` after changing engine behavior. An optional engine being absent in a user's environment is different from a failed required development check.

Writing findings remain advisory. See [Quality review](quality-review.md) for how to preserve meaning and voice instead of treating every signal as a required edit.
