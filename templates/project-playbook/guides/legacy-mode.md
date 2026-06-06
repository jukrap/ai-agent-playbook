# Legacy Mode

Use this guide for old, high-coupling, or operationally sensitive production systems.

## Default attitude

- Prioritize operational stability and narrow blast radius over new technology adoption.
- Even if code looks old, first find out why it works that way.
- Do not treat rewrites, framework swaps, or large folder restructures as default options.
- Find the smallest change that solves the requested problem.

## First checks

- actual runtime entrypoint
- deployment flow and output locations
- common includes, layouts, templates, globals, and shared scripts
- backend contracts and database/schema/migration impact
- project or team style preference
- constraints such as old browsers, closed networks, WebView, device plugins, printers, or scanners

## Change rules

- Use `rg` to find hidden coupling.
- When similar file names exist, identify which file is actually loaded at runtime.
- Check blast radius before changing shared CSS, JS, templates, schemas, or form fields.
- Respect local style conventions even when they are not modern.
- If automated tests do not exist, write concrete manual verification scenarios.

## Red flags

- deleting a file because it seems unused without proof
- changing shared selectors or classes
- changing form field names
- guessing backend contracts
- editing build output directly
- pushing directly to a protected or deployment branch
- making a large direction change without a worklog

## Expected output

- reason for the change and blast radius
- screens, jobs, endpoints, or scenarios checked
- verification command or manual check result
- remaining risks and follow-up work

