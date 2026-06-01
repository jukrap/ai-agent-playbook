# SI Legacy Mode

SI 프로젝트와 오래된 운영 시스템에 사용합니다.

## 기본 태도

- 신기술 도입보다 운영 안정성과 좁은 영향 범위를 우선합니다.
- 코드가 낡아 보여도 왜 그렇게 동작하는지 먼저 확인합니다.
- rewrite, framework swap, 대규모 folder restructure를 기본 선택지로 두지 않습니다.
- 사용자가 요청한 문제를 해결하는 가장 작은 변경을 찾습니다.

## 첫 확인

- 실제 production entrypoint
- deployment flow와 output locations
- common includes, layouts, templates
- globals와 shared scripts
- backend contracts와 DB/schema/migration impact
- customer, senior, team style preference
- old browsers, closed networks, WebView, ActiveX, printers, scanners 같은 제약

## 변경 규칙

- `rg`로 hidden coupling을 찾습니다.
- 비슷한 파일명이 여러 개 있으면 runtime에 실제로 load되는 파일을 찾습니다.
- shared CSS 또는 JS 변경 전 blast radius를 확인합니다.
- inline-style preference가 team rule이면 존중합니다.
- 자동 테스트가 없으면 구체적인 manual verification scenario를 남깁니다.

## Red flags

- 증명 없이 "안 쓰이는 것 같다"며 파일 삭제
- shared selector/class 변경
- form field name 변경
- backend contract 추측
- build output 직접 수정
- production branch에 직접 push
- worklog 없이 큰 방향 변경

## Expected output

- 변경 이유와 blast radius
- 실제 확인한 screen 또는 scenario
- verification command 또는 manual check result
- remaining risks와 follow-up work
