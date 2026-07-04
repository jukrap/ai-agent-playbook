# Visual Evidence Package

## Evidence Types

- Baseline screenshots from the current product.
- Reference screenshots or generated mockups when licensing and privacy allow.
- Before/after screenshots from the implementation.
- Viewport matrix: mobile, tablet, desktop, wide desktop, and relevant embedded sizes.
- State matrix: default, hover, focus, selected, disabled, loading, empty, error, success, overflow, and long content.
- Accessibility notes: contrast, keyboard focus order, reduced motion, text scaling, and screen-reader semantics where relevant.
- Interaction notes: pointer, keyboard, touch, scroll, drag, animation, and media loading behavior.

## Packaging Rules

- Store generated evidence under `.ai-agent-playbook/runtime/` or another project-local runtime area until reviewed.
- Promote only reviewed decisions into `memory/`, design docs, or source comments.
- Use portable locators and relative paths in public docs.
- Avoid large embedded images in reusable skills. Link or summarize evidence instead.
- Keep raw screenshots containing credentials, customer data, internal URLs, or personal data out of public documentation.

## Review Questions

- Does the evidence show the exact state being claimed?
- Is the viewport and content length realistic?
- Does the design still work with longer labels, translated text, empty data, and error states?
- Does the evidence include the primary interaction and keyboard path?
- Are reference visuals clearly separated from product truth?

## Acceptance Criteria

A visual adoption claim is ready only when:

- the source boundary is clear,
- the local mapping is explicit,
- before/after or target evidence exists,
- unresolved accessibility and content-fit risks are named,
- verification commands or manual checks are recorded.
