---
name: legacy-contracts
description: Use when maintaining a legacy system whose browser, template, database, device, or deployment contracts must be preserved.
---

# Legacy Contracts

Identify the deployed runtime and contract that the requested change touches. Keep version, encoding, selector, form, session, database, device and bridge assumptions explicit. Existing compatibility requirements do not require a general modernization workflow.

Read `references/contract-map.md` to select the relevant stack reference. Read only that reference; do not load every legacy profile. Distinguish static/fixture checks from verification in the required browser, engine, database or device. Missing runtime evidence limits the claim, not all independent implementation work.
