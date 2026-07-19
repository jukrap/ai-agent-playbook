# Python Candidate Recovery 0.5.10

Version 0.5.10 keeps Python capability discovery available when one platform command alias fails synchronously during process creation.

## What changed

- Each interpreter candidate is now probed behind its own process-creation boundary.
- A synchronous spawn failure is recorded on that candidate instead of rejecting the full `pythonEngineStatus` operation.
- Discovery continues to repo-local virtual environments, `python`, `python3`, and Windows `py -3` candidates in the documented order.
- The same injectable spawn boundary is used by the naturalness engine after interpreter selection.
- The Python module version now matches the Node package and Python distribution release metadata, and packaging tests reject future drift.

## Compatibility and safety

- Candidate order and the JSON status contract are unchanged.
- A failed candidate is reported as unavailable with its process error; another candidate must still prove that the Python engine can be imported before selection.
- The bridge remains local, non-daemonized, file-read-only, and network-free.

## Verification focus

- A simulated synchronous `spawn UNKNOWN` for one candidate does not hide a working interpreter.
- The real Windows validation path succeeds when `python.exe` works but the `python3` App Execution Alias cannot be spawned.
