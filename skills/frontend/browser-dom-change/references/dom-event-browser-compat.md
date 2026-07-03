# DOM Event and Browser Compatibility

Use this before changing DOM-first behavior, delegated events, selectors, plugin lifecycle, forms, or script loading.

## Contract surface

- IDs, classes, names, data attributes, ARIA attributes, and generated markup.
- Direct events, delegated events, inline handlers, and plugin hooks.
- Script load order, global variables, document-ready timing, and dynamic imports.
- Form serialization, hidden fields, checkbox/radio defaults, file inputs, and validation display.
- AJAX request shape, response shape, redirects, and server-rendered fallback behavior.

## Compatibility checks

- Confirm the browser support target before using modern APIs or syntax.
- Check whether the project transpiles, polyfills, or serves scripts directly.
- Confirm the DOM exists at binding time.
- Confirm repeated initialization does not double-bind events.
- Confirm dynamic DOM updates preserve event handlers or delegation.
- Confirm old plugins are initialized and destroyed in the expected order.

## Failure modes

- Renaming a selector breaks another screen.
- Binding runs before markup exists.
- A delegated event selector becomes too broad.
- A plugin is initialized twice after partial page updates.
- Form serialization drops disabled fields or unchecked checkboxes.
- Client validation diverges from server validation.

## Verification

- Initial page load.
- Repeated user action.
- Validation failure.
- Dynamic add/remove/update of DOM nodes.
- Browser back/reload if stateful forms are involved.
- Target legacy browser or documented fallback environment when required.

When server-rendered markup owns the contract, verify the server path as well as the browser path.
