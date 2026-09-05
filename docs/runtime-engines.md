# Runtime engines

Node.js ESM remains the CLI and MCP runtime. The package keeps Node 18+ as the public floor; development and platform evidence must state the actual version exercised. TypeScript is a development checker, not a runtime analysis engine. AST-grep and PNG-diff dependencies were removed with retired analysis commands.

The optional Python 3.11+ writing engine retains the existing interpreter selection and JS fallback. CLI writing checks use JS by default; --engine auto or python opts into Python discovery. Python release metadata uses the corresponding PEP 440 development version for npm prereleases. No model inference or new service is required by the runtime.

Interpreter probes have an eight-second bound per candidate, allowing slower cold starts while keeping discovery finite. Failed Python validation reports candidate errors; a timeout is not proof that Python is absent.
