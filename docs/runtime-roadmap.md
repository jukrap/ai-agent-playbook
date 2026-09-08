# Release readiness and follow-up

Release readiness covers workspace membership, interactive and argument bootstrap, Git-independent records, durable authoring, and their upgrade/recovery path. Readiness depends on observable behavior and a usable adoption path, not only a version field or a reduced catalog. The [verification report](verification.md) records evidence already gathered; this page explains how to assess the remaining release decision.

## Readiness areas

| Area | Evidence to review |
| --- | --- |
| Runtime | Required syntax/type/tests/Python checks and public-command compatibility |
| Records | Minimal/standard creation, worklogs/knowledge, filtered continuation, preserved old layouts and evidence |
| Workspaces | Explicit membership, ancestor resolution, member-local source selection, code targeting, and registry backups |
| Bootstrap | Interactive/non-interactive defaults, no-Git use, four exclusion modes, cancellation, and recovery |
| Installation | Selected profiles, owned-file preservation, preview, interrupted recovery, repeat rollback |
| MCP | Four default record tools plus optional AST, workspace arguments, bounded reads, actual stdio transport and host loading |
| Forge | Stable identifiers, stale-state conflicts, partial failures, and declared live/mock scope |
| Human documentation | Beginner practice, command examples, troubleshooting, language-specific presentation, and understandable Korean |
| Package | Actual archive contents, images/links, isolated install, exact version and checksum |
| Environment | Installed count, discovered catalog, injected context, and tools measured separately |

## Prepare the next release

First resolve findings that affect preservation, command correctness, or the documented first-use path. Repeat affected checks after fixes. Then prepare aligned Node/Python versions, changelog, migration notes, and a reviewed package archive using the [publishing checklist](publishing-checklist.md).

A GitHub merge is not npm publication; archive installation does not require registry publication. Record the exact artifact approved for release and preserve the prior runtime and relevant backups. Do not claim every platform or host is verified merely because one local run or a CI matrix passed.

## Work outside this release

The redesigned package does not restore execution, scheduling, or broad analysis merely to match old feature counts. Specialist Writer/Game changes require their own product plans and execution contracts. Experimental host history/notes features are not a required dependency for ordinary record use.

Further features should fill a demonstrated capability gap and include a migration path if they alter records or public commands. Human guides may grow when that makes adoption clearer; instruction reduction is not a documentation-size target.
