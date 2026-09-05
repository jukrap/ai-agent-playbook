# Report and Print Contract

Use this before changing reports, print output, exports, labels, invoices, or device-specific output.

## Contract surface

- Data query and filter parameters.
- Template source and formatting layer.
- Output fields, column order, grouping, totals, and sorting.
- Page size, margins, orientation, DPI, fonts, and barcode/QR requirements.
- Locale, timezone, number formatting, date formatting, and currency precision.
- Export library, browser print path, printer driver, device path, and paper/label stock.

## Consumer checks

- Human reader.
- Finance, audit, warehouse, support, or other operating team.
- Downstream spreadsheet macro or upload.
- Barcode scanner, label printer, invoice printer, or third-party recipient.
- Archive, legal, or compliance retention process.

## Verification cases

- Representative normal output.
- Long text and wrapping.
- Empty and null values.
- Many rows and multi-page output.
- Boundary totals and rounding.
- Barcode/QR scan readability.
- Excel/PDF/print output when more than one path exists.

## Failure modes

- Screen preview differs from physical print output.
- Font substitution changes pagination.
- Column order changes a downstream spreadsheet or import.
- Locale or timezone changes reported business date.
- A template field is removed but used by a printer, macro, or archived document process.

Record the exact browser, export format, printer path, sample data, and environment used for validation.
