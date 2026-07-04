# Legacy Mode

오래되었거나 coupling이 크거나 operationally sensitive한 production system에 사용합니다.

## Default attitude

- 새 기술 도입보다 operational stability와 narrow blast radius를 우선합니다.
- code가 오래되어 보여도 먼저 왜 그렇게 동작하는지 확인합니다.
- rewrite, framework swap, large folder restructure를 기본 선택지로 두지 않습니다.
- 요청된 문제를 해결하는 가장 작은 변경을 찾습니다.

## First checks

- actual runtime entrypoint
- deployment flow and output locations
- common includes, layouts, templates, globals, shared scripts
- backend contracts and database/schema/migration impact
- project 또는 team style preference
- old browsers, closed networks, WebView, device plugins, printers, scanners 같은 constraints

## Change rules

- 숨은 coupling은 `rg`로 찾습니다.
- 비슷한 file name이 여러 개면 runtime에서 실제로 load되는 file을 확인합니다.
- shared CSS, JS, templates, schemas, form fields를 바꾸기 전에 blast radius를 확인합니다.
- modern하지 않더라도 local style convention을 존중합니다.
- automated tests가 없으면 concrete manual verification scenarios를 작성합니다.

## Red flags

- proof 없이 seems unused라는 이유로 file 삭제
- shared selectors 또는 classes 변경
- form field names 변경
- backend contracts 추측
- build output 직접 편집
- protected 또는 deployment branch에 직접 push
- worklog 없이 large direction change

## Expected output

- change reason and blast radius
- checked screens, jobs, endpoints, or scenarios
- verification command 또는 manual check result
- remaining risks and follow-up work
