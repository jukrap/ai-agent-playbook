# AGENTS.md
# Legacy jQuery Web Profile

Use this profile for legacy browser projects built around jQuery, plugins, direct DOM manipulation, and global scripts.

## Start rules

- Confirm the active HTML/template, script include order, globals, and server-rendering involvement first.
- A build tool may not exist. Check README, deployment flow, and production file locations.
- Trace selectors, event delegation, plugin initialization, and global side effects.
- Prefer small changes. Do not make a rewrite the default option.

## Change strategy

- Preserve existing DOM structure and class/id contracts.
- Search every selector you plan to touch with `rg`.
- Check duplicate event handlers, initialization order, AJAX callbacks, modals, tables, and plugin lifecycle.
- Match the project's existing jQuery/plugin style.
- Avoid new globals when an existing namespace or module pattern exists.

## UI and styling

- Follow whichever style mechanism the project actually uses: inline styles, class toggles, or existing CSS files.
- Respect inline-style preference when it is the project-local rule.
- Check table width, long text, small monitors, IE, and old-browser requirements.

## Verification

- If automated tests do not exist, open the real page, exercise changed click/input/AJAX flows, and inspect console/network output.
- Confirm old-browser support before using newer syntax.
- Manually verify at least one screen connected to each changed selector.

## Git and worklogs

- Legacy work often has hidden blast radius. Record the reason for the change, verified screens, and remaining risks in a worklog.
- Keep local-only docs and generated outputs out of staged changes.
