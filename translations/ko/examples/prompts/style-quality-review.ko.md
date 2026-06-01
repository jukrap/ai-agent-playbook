# Style Quality Review Prompt

현재 디자인 의도를 유지하면서 style quality를 review할 때 사용합니다.

```text
현재 화면의 기능과 디자인 의도는 유지하면서 style quality를 review해줘.

먼저 repository structure, README, AGENTS.md, 관련 local docs, 현재 git state를 확인해.
그 다음 관련 component와 style file을 찾아서 문제를 아래 기준으로 분류해줘.

1. visible breakage 또는 responsive problem
2. CSS/inline style conflict, duplication, cascade risk
3. shared UI/primitive를 써야 하는데 직접 구현한 부분
4. missing loading, empty, error, disabled states
5. 의도한 디자인을 과하게 바꿀 위험

수정이 필요하면 visual intent를 유지하는 가장 작은 변경으로 처리해.
프로젝트가 inline style을 명시적으로 선호하면 그 정책을 따라.
완료 전 프로젝트가 정의한 lint/test/build 또는 rendered-screen check를 fresh output으로 검증해.
local-only docs는 commit하지 마.
```
