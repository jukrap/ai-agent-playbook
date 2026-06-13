# Frontend UI Polish Checklist

## Product fit

- Match the product type. Operational tools should be dense, calm, and scan-friendly. Consumer, portfolio, or marketing surfaces can be more expressive when the request calls for it.
- Keep existing navigation, information architecture, and primary workflows recognizable.
- Improve the active task first before adding secondary decoration.

## Layout and hierarchy

- Make the first visible screen immediately useful for the target workflow.
- Use stable dimensions for controls, boards, toolbars, counters, grids, cards, and fixed-format areas.
- Prevent text, icons, labels, controls, and dynamic content from overlapping at common viewport widths.
- Keep nested cards, decorative wrappers, and unnecessary section chrome out of utilitarian interfaces.
- Use icons for familiar commands and short labels only when they improve clarity.

## States

- Cover loading, empty, error, disabled, selected, focus, hover, and long-content states when the component exposes them.
- Keep destructive, irreversible, or high-risk actions visibly distinct from routine actions.
- Preserve keyboard and screen-reader affordances already present in the project.

## Responsive behavior

- Check mobile, tablet, and desktop breakpoints that the project supports.
- Verify long labels, table cells, buttons, forms, dialogs, sidebars, and navigation items.
- Prefer wrapping, truncation, or layout changes over shrinking text with viewport width.

## Style system

- Reuse shared components, tokens, variants, class conventions, or utility patterns before adding new styling.
- Avoid one-off color systems, arbitrary spacing scales, and local component forks.
- If the project has no clear style system, follow nearby component patterns and keep changes local.

## Verification

- Run project-defined lint, type, test, or build commands when relevant.
- Use browser or rendered UI checks for visible changes.
- Report only the viewports, states, and commands actually checked.
