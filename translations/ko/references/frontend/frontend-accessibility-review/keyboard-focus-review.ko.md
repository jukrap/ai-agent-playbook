# Keyboard Focus Review

## Inventory

- Pattern: button, link, form field, menu, listbox, combobox, tabs, dialog, popover, toast, table, tree, drag/drop, custom widget.
- Keyboard path: Tab, Shift+Tab, Enter, Space, Escape, arrow, Home/End, Page Up/Down, 필요한 경우 typeahead.
- Focus lifecycle: initial focus, visible focus, roving focus, trapped focus, restored focus, disabled item behavior, route/modal transition.
- Dynamic state: loading, validation error, async success, item added/removed, pagination, virtualized content, hidden/visible change.

## Review

- 모든 interactive element에는 사용자가 인식하는 pattern에 맞는 keyboard path가 필요합니다.
- Focus order는 visual/task order를 따라야 하며 hidden, inert, disabled content로 들어가면 안 됩니다.
- Dialog와 blocking overlay는 focus를 내부로 이동시키고, 열린 동안 trap하며, 예측 가능하게 닫히고, 유용한 trigger로 focus를 복원해야 합니다.
- Custom widget은 native element나 design-system primitive가 가능할 때 click-only handler에 의존하지 않아야 합니다.
- Loading과 disabled state는 focus를 고립시키거나 대체 target 없이 사용자의 위치를 없애면 안 됩니다.

## Verification

- Keyboard만으로 primary workflow를 완료합니다.
- Dialog, menu, popover, validation error를 keyboard만으로 열고 닫습니다.
- Focus indicator가 실제 background 위에서 계속 보이는지 확인합니다.
- Repeated interaction, route change, pagination, item deletion을 확인합니다.
- Escape와 outside-click behavior가 focus restoration과 충돌하지 않는지 확인합니다.

## Stop Conditions

- Target pattern이 custom이고 keyboard model이 정의되어 있지 않습니다.
- Focus가 modal 뒤나 hidden content로 이동할 수 있습니다.
- Pointer로 가능한 action을 keyboard로 실행할 수 없습니다.
- Validation 또는 async update가 recovery path 없이 focus를 제거할 수 있습니다.
