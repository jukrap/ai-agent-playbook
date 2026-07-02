# Keyboard Focus Review

## Inventory

- Pattern: button, link, form field, menu, listbox, combobox, tabs, dialog, popover, toast, table, tree, drag/drop, or custom widget.
- Keyboard path: Tab, Shift+Tab, Enter, Space, Escape, arrows, Home/End, Page Up/Down, and typeahead where expected.
- Focus lifecycle: initial focus, visible focus, roving focus, trapped focus, restored focus, disabled item behavior, and route/modal transitions.
- Dynamic states: loading, validation error, async success, item added/removed, pagination, virtualized content, and hidden/visible changes.

## Review

- Every interactive element needs a keyboard path that matches the pattern users recognize.
- Focus order should follow visual/task order and should not enter hidden, inert, or disabled content.
- Dialogs and blocking overlays should move focus inside, trap focus while open, close predictably, and restore focus to a useful trigger.
- Custom widgets should not rely on click-only handlers when native elements or design-system primitives are available.
- Loading and disabled states should not strand focus or remove the user's place without a replacement target.

## Verification

- Complete the primary workflow with keyboard only.
- Open and close dialogs, menus, popovers, and validation errors with keyboard only.
- Confirm focus indicator remains visible against the actual background.
- Check repeated interactions, route changes, pagination, and item deletion.
- Confirm Escape and outside-click behavior do not conflict with focus restoration.

## Stop Conditions

- The target pattern is custom and has no defined keyboard model.
- Focus can move behind a modal or into hidden content.
- A user can trigger an action by pointer but not by keyboard.
- Validation or async updates can remove focus without a recovery path.
