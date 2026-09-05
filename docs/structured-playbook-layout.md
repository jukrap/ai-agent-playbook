# Project records

The current entrypoint is CURRENT.md. A new bootstrap creates it with manifest.json and an ownership marker; CURRENT.md is user-editable. Detailed decisions, contracts, plans and handoffs are created only when needed, using existing project paths.

Existing structured and legacy record trees remain readable. The reader does not require the old collection of policies, maps, runtime folders or workflow recipes. It reports ambiguous roots, unreadable text and incomplete scans.

Layout migration updates only owned, unchanged metadata and preserves existing records. It never rewrites root instructions or summarizes old work automatically. The archive stores the original manifest and ownership marker. Use migrate rollback with its playbook-relative backup path for hash-checked restoration; later edits cause a conflict. See [lifecycle](lifecycle.md) and [commands](commands.md).
