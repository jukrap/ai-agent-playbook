# Jira Worklog Example

Use this shape when the worklog is intended for a Jira ticket, sprint note, or team-facing work record. The English source keeps the canonical structure and meaning. Localized translations may adapt section titles and prose to the target Jira language.

### Title

`Delivery tracking filter and detail modal interaction cleanup`

### Summary

- Reworked the search condition input flow and detail entry point around the user's actual lookup flow.
- Kept behavior consistent across mobile and desktop even when the UI shape differs by viewport.

### Background

- Search conditions were scattered across multiple inputs, taking too much space and colliding with buttons on smaller screens.
- Opening details by clicking the entire card did not match the expected interaction, so the entry point needed to move to the tracking-number link.

### Observed Problem

- On small screens, the search filters wrapped and partially hid the right-side action button.
- The wide card click target could open the modal on touches that were not intended as detail navigation.
- When the modal opened, background scrolling and side spacing looked unstable.

### Cause

- Input fields and action buttons did not have a clear priority, so they competed for the same row as the screen width narrowed.
- The whole card still had click affordance, making the actual detail entry point visually unclear.
- Modal alignment and scroll locking were not tied to one consistent rule.

### Changes

- Reorganized search conditions in the order of date range, search field, keyword, status, and search action.
- Changed detail navigation so it opens only from the tracking-number link, not from the whole card.
- Unified modal centering, background scroll locking, and mobile spacing around one layout rule.

### Verification

- `pnpm test:run`
- `pnpm lint`
- `pnpm build`

### Remaining Work

- Check on a real mobile device that the keyboard and date picker layer do not overlap.
- Fine-tune card wrapping and badge placement at tablet mid-width if needed.
