# SI Legacy Mode

Use this guide for SI projects and old production systems.

## Default attitude

- Prioritize operational stability and narrow blast radius over new technology adoption.
- Even if code looks old, first find out why it works that way.
- Do not treat rewrites, framework swaps, or large folder restructures as default options.
- Find the smallest change that solves the user's requested problem.

## First checks

- actual production entrypoint
- deployment flow and output locations
- common includes, layouts, and templates
- globals and shared scripts
- backend contracts and DB/schema/migration impact
- client, project, or team style preference
- constraints such as old browsers, closed networks, WebView, ActiveX, printers, or scanners

## Change rules

- Use `rg` to find hidden coupling.
- When similar file names exist, identify which file is actually loaded at runtime.
- Check blast radius before changing shared CSS or JS.
- Respect inline-style-first convention when it is the team rule.
- If automated tests do not exist, write concrete manual verification scenarios.

## Red flags

- deleting a file because it "seems unused" without proof
- changing shared selectors/classes
- changing form field names
- guessing backend contracts
- editing build output directly
- pushing directly to a production branch
- making a large direction change without a worklog

## Expected output

- reason for the change and blast radius
- screens or scenarios actually checked
- verification command or manual check result
- remaining risks and follow-up work
