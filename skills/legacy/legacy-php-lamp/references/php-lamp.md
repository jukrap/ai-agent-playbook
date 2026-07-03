# PHP LAMP Stack Checks

## Inspect Together

- Entry script, include order, shared config, bootstrap files, session start, auth guard, globals, superglobals, and form post handlers.
- Direct SQL, escaping layer, charset/collation, timezone, file paths, upload directories, temp files, output buffering, and error reporting mode.
- Template fragments, inline scripts, hidden inputs, query-string parameters, cookies, redirects, and server-rendered JavaScript values.
- Hosting constraints: PHP version, extensions, Apache/Nginx rewrite rules, document root, filesystem permissions, cron jobs, and deployment copy order.

## Change Risks

- Include order or global mutation can change unrelated pages that share bootstrap files.
- A parameter rename can break forms, AJAX, redirects, exports, or pagination links generated elsewhere.
- Mixed escaping, character encoding, and direct SQL can turn a small UI change into an injection, mojibake, or data-loss bug.
- File upload and download paths often depend on hosting-specific permissions and temporary directories.

## Verification

- Exercise GET, POST success, validation failure, auth/session failure, redirect, refresh/back-button, and repeated-submit behavior.
- Verify SQL parameters, affected rows, transactions or manual rollback expectations, and output encoding for changed data paths.
- Check file upload/download, generated CSV/Excel/PDF, email, or print output when the page touches files or reports.
- Check server logs or visible error mode when include paths, deployment roots, or extension assumptions changed.
- Pair with `backend/server-rendered-change`, `database/database-change-safety`, or `security/security-review` when the change touches data or auth.
