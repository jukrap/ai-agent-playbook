# AI Agent Playbook v2 교차 영역 보강 계획

## 목표

디자인 팩 이후 AI Agent Playbook v2 확장을 이어서 3D/WebGL, 보안, 백엔드 비동기 경계, 아키텍처 재설계 판단, 레퍼런스 채택 관리, 한국어 번역 품질을 강화합니다.

## 확인한 점

- 레퍼런스 폴더에는 보안, 아키텍처, 백엔드, 프론트엔드, 디자인, MCP, delivery, 하네스 관리 전반의 신호가 넓게 있습니다.
- 디자인 범위는 크게 강화되었지만, 3D/WebGL 지침은 Three.js 운영 작업에 쓰기에는 아직 일반적이었습니다.
- `security-review`는 에이전트 보안, 프롬프트 주입, MCP/도구 신뢰, 메모리 오염, 프로젝트 로컬 설정 위험을 다루기에는 너무 짧았습니다.
- `backend-change-safety`는 서버 측 소유권은 잘 다루지만 비동기 전달, 웹훅 검증, 재시도, 데드레터, 멱등성 점검에는 전용 참고 문서가 필요했습니다.
- `boundary-review`에는 로컬 관례 유지, FSD/DDD/레이어드 규칙 도입, 패키지 분리, 넓은 구조 개편 제안을 판단하는 더 깊은 절차가 필요했습니다.
- 한국어 번역은 구조적으로는 유효하지만, 많은 파일이 한국어 조사만 붙은 영어 원문처럼 읽힙니다.

## 이번 단위 작업

- `interactive-media-3d-review`에 Three.js/WebGL 운영 점검을 추가합니다.
- `security-review`에 일반 보안 검토와 에이전트/도구 위협 참고 문서를 추가합니다.
- `backend-change-safety`에 비동기 경계와 멱등성 점검을 추가합니다.
- `boundary-review`에 아키텍처 경계 재설계 절차를 추가합니다.
- 이후 레퍼런스 사용이 출처명 누적이 아니라 역량 중심 추출을 따르도록 `docs/reference-adoption.md`를 다시 씁니다.
- 편집한 스킬과 문서 표면의 한국어 번역을 개선합니다.

## 다음 단위 작업

1. 보안 팩 심화:
   - `auth-access-control`에 테넌트/관리자/역할 매트릭스 증거를 보강합니다.
   - `dependency-supply-chain-review`에 설치 스크립트, 바이너리, lockfile, 생성 코드 점검을 보강합니다.
   - 에이전트 위협 검토용 MCP/security 워크플로우 레시피를 추가합니다.
2. 백엔드와 아키텍처 심화:
   - 서비스 분해와 연동 어댑터 참고 문서를 추가합니다.
   - `boundary-review`, `domain-model-change`, `monorepo-package-boundary`를 묶는 아키텍처 의사결정 기록 워크플로우를 추가합니다.
   - 기존 린트 도구가 있는 프로젝트를 위한 import/dependency 규칙 예시를 추가합니다.
3. 3D와 시각 런타임:
   - 캔버스/WebGL 표면용 시각 증거 레시피를 추가합니다.
   - 스크린샷/픽셀 증거를 사용하는 인터랙티브 장면 검토 MCP 프롬프트를 선택적으로 추가합니다.
   - Playwright 스크린샷 점검, 픽셀 점검, 모션 감소 경로를 연결하는 문서를 추가합니다.
4. 번역 정리:
   - 공개 문서부터 우선합니다: README, commands, classification, skill taxonomy, playbook layout, MCP permission model.
   - 그 다음 사용 빈도가 높은 스킬 번역을 분류별로 정리합니다.
   - 한국어가 더 부정확해질 때만 기술 용어 원문을 유지합니다.
5. 레퍼런스 장부:
   - 새로 채택한 교차 영역 실무 방식을 채택 장부에 표시합니다.
   - `_reference`는 generic capability summary를 제외하고 commit과 public docs에 넣지 않습니다.

## 검증

- `npm run check`
- `npm test`
- `.\scripts\validate-skills.ps1`
- `.\scripts\validate-translations.ps1`
- `.\scripts\validate-public-docs.ps1`
- `.\scripts\sync-skills.ps1 -WhatIf`
- `.\install.ps1 -SkipValidation -WhatIf`
- `.\update.ps1 -SkipValidation -WhatIf`
- 스킬 원문 검증 후 `.\scripts\sync-skills.ps1`
