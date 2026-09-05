# Generic UI Review Candidates And Evidence

## Start from product fit

Record the product type, primary task, expected information density, input method, and important viewports. A dashboard, editor, storefront, and campaign page can use the same visual device for different reasons. Existing brand tokens and established components are constraints, not noise to erase.

## Static candidate rules

`aapb qa ui-genericity-scan` reports a compact set of semantic rule IDs:

- `visual.gradient-text`: gradient clipping is applied directly to text.
- `visual.ambient-glow`: multiple non-interactive blur or glow decorations appear in one file.
- `visual.glass-surface`: blur and translucent background treatments are combined.
- `shape.pill-taxonomy`: pill-shaped badge or status treatments repeat as a taxonomy.
- `layout.nested-cards`: a card-like component contains the same surface type.
- `shape.radius-shadow-stack`: a large radius and heavy shadow are stacked on one surface.
- `content.decorative-stats`: several oversized stat treatments appear together.
- `motion.uniform-hover-transform`: the same scale or translation hover treatment repeats.
- `content.repeated-kicker`: uppercase, widely tracked kicker treatments repeat.
- `copy.generic-marketing-claims`: multiple generic claims appear without product-specific evidence.

These are review candidates, not automatic defects. A single intentional gradient, badge, or hover state should not trigger aggregate rules. Generated output, dependencies, lockfiles, minified assets, local references, work directories, and playbook runtime files are excluded.

## Suppression

Use `ui-review-ignore <rule-id>` in a source comment only after rendered review confirms that the treatment is deliberate. Suppression is file-scoped and limited to the built-in rule IDs. Do not load or execute external rule modules.

## Review questions

- Does the treatment help users find, compare, enter, or confirm information?
- Is the visual emphasis proportional to task importance?
- Does repeating the device create hierarchy or flatten it?
- Can one layer, border, shadow, badge, or marketing phrase be removed without losing meaning?
- Does the proposed change preserve established brand expression and accessible states?

## Evidence

For a confirmed issue, record the rule ID or observed symptom, affected screen, viewport, user impact, and a rendered screenshot or video. After changes, compare the same state and viewport. Do not use a zero-finding scan as proof that the UI is complete.

## Remediation handoff

If the request is review-only, stop after evidence and recommendations. If implementation is authorized, pass the confirmed issue, product constraint, affected viewport, and expected outcome into `ui-polish` or the repository's UI workflow. Prefer removing or simplifying the smallest repeated device that restores hierarchy; do not flatten intentional brand expression or redesign unrelated screens.
