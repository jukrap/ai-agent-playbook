---
name: legacy-reporting-printing
description: Use when maintaining report generation, print preview, PDF/Excel export, barcode/label printing, invoices, templates, or printer/device-specific output flows.
---

# Legacy Reporting Printing

Treat output format, pagination, and device behavior as product contracts.

## Workflow

1. Identify template source, data query, formatting layer, export library, printer path, and device assumptions.
2. Check page size, margins, DPI, fonts, barcode/QR readability, locale, timezone, and number/date formatting.
3. Preserve existing output fields and layout unless product explicitly changes them.
4. Verify sample output with representative data, long text, empty values, and multi-page cases.
5. Record printer/browser/export environment used for validation.

## Guardrails

- Do not trust screen preview as proof of physical print correctness.
- Do not change Excel/PDF column order or template fields without downstream consumer checks.
- Do not assume fonts, printer drivers, or paper sizes are consistent across client machines.

## Reference

Read `references/report-print-contract.md` for report fields, pagination, export, printer, device, and downstream-consumer checks.
