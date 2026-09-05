# Playbook 1.0 설계

## 결정

패키지를 이식 가능한 프로젝트 기록, 선택한 문서 규격, 과제별 전문 기능에 집중시킵니다. Node ESM 구현, 패키지명, `aapb` 명령을 유지합니다. 광범위한 절차 라우팅을 작은 스킬 목록과 선택 참조로 바꿉니다. 모든 외부 스킬이 모든 모델에 해롭다는 전제로 진행하지 않습니다.

소스 기준선은 0.5.11입니다. 환경별 실행 파일 버전, 설정, 설치 경로, 해시, worktree, 복구 자료는 로컬 근거에 따로 보관합니다.

## 근거와 한계

- [Astra 모델 가이드](https://developers.openai.com/api/docs/guides/latest-model)는 지침 감사와 과제에 맞는 검증 범위를 권고합니다. 중복 요건을 줄일 근거이며 고유 계약을 없앨 근거는 아닙니다.
- [AGENTS.md 평가 연구](https://arxiv.org/abs/2602.11988)는 이전 모델과 저장소 지침 구성을 평가했습니다. 추가 탐색과 비용을 Astra의 실측 회귀로 해석하지 않습니다.
- [SkillsBench](https://arxiv.org/abs/2602.12670)는 정제된 스킬과 자체 생성 스킬을 구분하며 과제별 효과가 다릅니다. 과제에 주어진 작은 스킬 묶음의 결과를 전역 설치 수 제한으로 옮기지 않습니다.
- [SWE-Skills-Bench](https://arxiv.org/abs/2603.15401)도 소프트웨어 과제 비교이며 이 환경의 실측 결과가 아닙니다.
- [ARC Prize의 Astra 분석](https://arcprize.org/blog/astra)은 표준·제공자 어댑터 하네스와 추론 수준을 구분합니다. 실행 상태 보존의 중요성을 보여 주지만 코딩 과제에서 AAPB나 Superpowers를 비교하지는 않습니다.
- [Superpowers](https://github.com/obra/superpowers)의 필수 계획·worktree·테스트 우선·리뷰 절차는 호스트 및 기존 사용자 지침과 겹칩니다. 비활성 상태를 유지하며 해당 절차를 적용하지 않습니다.
- 커뮤니티 사용기는 조사 단서입니다. 이번 조사에서 X와 디시 원문 직접 조회는 실패했고, Threads에서는 모델·과제·설정이 맞는 비교를 확보하지 못했습니다. 검색 발췌나 재인용을 원문 확인으로 보고하지 않습니다.

설계 조사 시점의 자료를 확인했고, 공개 main을 실제 계정 rollout으로 간주하지 않고 설치된 Codex 0.153.4 계열과 비교했습니다.

## 네이티브 맥락과 비용

[버전별 모델 설정 코드](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/models-manager/src/model_info.rs)는 컨텍스트 override를 지원 최대값으로 제한합니다. [모델 프로토콜](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/protocol/src/openai_models.rs)은 설정값, 사용 가능 범위, 자동 압축 한도를 구분합니다.

[history/notes 확장](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/ext/history-notes/src/extension.rs)은 설정·제공자·백엔드 인증을 확인하며 thread hint를 4,000 bytes로 제한합니다. 소스와 모델 기본 활성화 경로가 존재해도 실제 세션 도구 노출까지 증명하지는 않습니다. 사용할 수 없으면 파일 기록으로 진행하며 실험 설정을 필수로 요구하지 않습니다.

[스킬 렌더러](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/ext/skills/src/render.rs)는 예산에 따라 설명을 줄이거나 항목을 생략합니다. 설치 디렉터리, 검색된 스킬, 렌더링된 항목, 실제 호출을 별도로 집계합니다.

[API 캐싱](https://developers.openai.com/api/docs/guides/prompt-caching), [구독 한도](https://learn.chatgpt.com/docs/pricing), [개인 구매 크레딧](https://help.openai.com/en/articles/12642688), [Enterprise 토큰 과금](https://help.openai.com/en/articles/20001415-chatgpt-rate-card-enterprise-token-based-pricing)은 별개입니다. Enterprise의 Astra/Codex 장문 예외로 개인 구독 계산식을 단정하지 않습니다. 관측한 토큰과 캐시 입력을 기록하되 한도 퍼센트를 작업 비용으로 환산하지 않습니다.

## 스킬과 참조의 경계

[전수 판정표](skill-decisions.ko.md)와 기계 판독용 자료를 기준으로 합니다. 코어는 project-memory와 spec-artifacts, 개발 구성은 design-brief-direction·ui-polish·natural-writing-humanization을 추가하며 레거시 계약은 별도로 선택합니다.

디자인 방향, 렌더링된 UI 검토, 도구 연결, 문서 편집, 코드 구조 정리를 구분합니다. 브랜드 표현, 정보 밀도, 접근성, 용어, 문체와 수정 전후 예시를 보존합니다. 그라데이션·카드·자연스러운 한국어 표현을 일괄 금지하지 않습니다. 일반 문서 규칙을 승인된 소설 문체에 일괄 적용하지 않습니다.

폐기한 진입점을 호환용 스킬로 다시 설치하지 않습니다. 고유한 참조는 명시적으로 선택하는 참조 라이브러리에 이전 위치와 함께 남깁니다. 참조 라이브러리는 시작 시 전부 읽는 목록이 아닙니다.

## 런타임 결정

- 최소 bootstrap은 CURRENT.md와 소유권·레이아웃 metadata를 만들며 빈 정책 문서 묶음을 생성하지 않습니다.
- structured 및 레거시 기록을 계속 읽습니다. 이전은 관리 파일만 변경하고 수정본·미관리 충돌과 원문을 보존합니다.
- MCP는 프로젝트에 묶인 aapb_status, aapb_search, aapb_read, aapb_validate만 제공합니다. 쓰기 도구와 필수 시작 훅은 없습니다.
- GitHub/Gitea는 검토된 협업 계획, 안정적인 식별자, 동시 수정 검사, 부분 실패 결과와 명시적 적용을 유지합니다. 자동 게시는 하지 않습니다.
- 작업 실행기·감독 루프·예약·자동 Git 전달과 중복 분석 명령은 종료합니다. 대체 기능과 고정 0.5.11 복구를 안내하며 구버전을 몰래 실행하지 않습니다.
- 글쓰기 검사는 선택적 참고 도구로 남깁니다. 모든 편집 때 실행하거나 작성 주체를 판정하지 않습니다.

## 설치와 복구

CLI와 PowerShell 래퍼는 같은 구현을 사용하며 기본 경로는 .agents/skills입니다. 이전은 기존 관리 설치본을 조사하고 해시·실제 경로를 확인한 뒤 전체 작업을 미리 보여 줍니다. 복구 기록을 만들고 독립적으로 안전한 항목을 적용합니다. 이름이 같다는 이유로 수정본·미관리 자료를 지우지 않으며 junction을 따라 삭제하지 않습니다.

변경 전에 대상 내용을 백업하고 각 적용 직전에 해시를 다시 확인합니다. 부분 완료를 기록해 재실행과 복구가 이후 사용자 편집을 덮어쓰지 않게 합니다. 플러그인 캐시와 다른 프로젝트 프로필을 보존합니다. 설정 수정만으로 호스트 재로딩 성공을 주장하지 않습니다.

## 단계와 완료 기준

설계를 먼저 커밋합니다. 런타임·스킬, 설치·복구, 최종 검증을 별도 이정표로 커밋합니다. 1.0.0-next.1에서 검증하고 1.0.0 전환을 준비하며 레지스트리 게시는 별개입니다.

기준선 테스트는 458개 통과, 1개 skip, 실패 0개였으며 구문·타입·스킬·번역·공개 문서·Python·설치 미리보기가 통과했습니다. 새 구현을 검증한 결과는 아닙니다.

소유권 충돌, 링크·junction, 제한된 기록 접근, 구버전 읽기, 읽기 전용 MCP, 이전·복구 재실행, 모의 Forge 충돌, 패키지 설치를 검증합니다. UI 두 사례, 한국어 문서 두 사례, 코드 정리 한 사례를 비교합니다. 정보 보존·제품 적합성·과잉 교정·호출·재독해·시간·확인 가능한 사용량을 기록하며 다섯 사례로 일반적인 성능 향상률을 주장하지 않습니다.
