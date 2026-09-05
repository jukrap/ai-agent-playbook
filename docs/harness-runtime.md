# Runtime boundary

The runtime serves portable project records and selected installation operations. CLI routes load optional skill, MCP, writing and forge modules only when selected. No autonomous executor, scheduler, code-index database or universal preflight service is started.

Record operations bind an existing project, locate one playbook, bound text reads/search and distinguish document validation from runtime proof. New output envelopes use schemaVersion 2; retained writing/forge result schemas remain unchanged. Older record content and ownership markers are read compatibly.

Installation uses checked roots, ownership and content hashes, staged replacement directories, a recovery journal and guarded rollback. Unrelated content is never inferred to be owned from its name. See [lifecycle](lifecycle.md).
