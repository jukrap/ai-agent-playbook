# IE and ActiveX Containment

Use this when old browser or device compatibility is a required runtime constraint.

## Environment capture

- Required browser, IE mode, document mode, compatibility view, and enterprise policy.
- Required ActiveX control, plugin, device driver, certificate, or installer.
- Security zone, trusted site, registry key, group policy, and user permission assumption.
- Operating system, bitness, Office/runtime dependency, and device model when relevant.
- Exact validation environment or reason it is unavailable.

## Compatibility boundaries

- Avoid modern JavaScript syntax unless the project already transpiles for the target mode.
- Avoid browser APIs unless the target runtime supports them or a proven polyfill exists.
- Preserve event model, window/dialog behavior, encoding, and file/device access flow.
- Keep object/embed identifiers and parameters stable unless every caller and client install is updated.
- Do not use a modern browser run as evidence for IE-mode behavior.

## Security checks

- Confirm whether the control has file, device, clipboard, certificate, or local network access.
- Do not broaden trusted origins or weaken prompts to make testing easier.
- Avoid logging sensitive local paths, document content, certificate details, or device identifiers.
- Document any manual installation, signing, or permission step needed for operation.

## Verification

- Required browser/document mode.
- Required security zone and enterprise policy.
- Happy path through the plugin or device flow.
- Failure path when the control is missing or permission is denied.
- Regression path for the adjacent non-plugin workflow if one exists.

If the required environment is unavailable, report it as a blocker or residual risk rather than claiming compatibility.
