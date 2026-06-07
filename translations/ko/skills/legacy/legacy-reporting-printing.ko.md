# Legacy Reporting Printing

Report generation, print preview, PDF/Excel export, barcode/label printing, invoices, templates, printer/device-specific output flow를 유지보수할 때 사용합니다.

## 진행 절차

1. template source, data query, formatting layer, export library, printer path, device assumptions를 식별합니다.
2. page size, margins, DPI, fonts, barcode/QR readability, locale, timezone, number/date formatting을 확인합니다.
3. product가 명시적으로 바꾸지 않는 한 기존 output fields와 layout을 보존합니다.
4. representative data, long text, empty values, multi-page cases로 sample output을 검증합니다.
5. 검증에 사용한 printer/browser/export environment를 기록합니다.

## Guardrails

- screen preview만으로 physical print correctness를 증명했다고 보지 않습니다.
- downstream consumer 확인 없이 Excel/PDF column order 또는 template fields를 바꾸지 않습니다.
- client machines마다 fonts, printer drivers, paper sizes가 같다고 가정하지 않습니다.
