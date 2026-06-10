# UI 스타일 정책 참고 자료

저장소 근거가 뒷받침하는 가장 좁은 정책을 사용합니다.

## 결정 순서

1. **Design system first**
   - 공유 컴포넌트, 토큰, variant, slot, UI primitive가 있습니다.
   - custom CSS, utility, inline style을 쓰기 전에 재사용합니다.

2. **CSS/class first**
   - stylesheet, CSS module, scoped CSS, semantic class name이 프로젝트 관례입니다.
   - 재사용 layout, variant, pseudo selector, media query, container query를 CSS/class에 둡니다.

3. **Utility class first**
   - Tailwind-style utility 또는 atomic class composition이 프로젝트 관례입니다.
   - custom CSS를 추가하기 전에 설정된 token과 variant로 조합합니다.

4. **Inline style first**
   - 프로젝트 문서, 코드, 사용자 지시가 컴포넌트 로컬 inline style object를 명시적으로 선호합니다.
   - inline style은 컴포넌트 로컬, 동적 값, 상태에서 파생된 값에 제한합니다.

## 충돌 처리

- 최신 사용자 지시와 저장소 문서가 일반 스타일 선호보다 우선합니다.
- 기존 로컬 컴포넌트 패턴이 외부 스타일 조언보다 우선합니다.
- 필요한 state를 design-system primitive가 지원하면 일회성 custom styling보다 우선합니다.
- 프로젝트가 여러 방식을 섞는다면 문서화된 migration이 없는 한 변경한 컴포넌트가 이미 쓰는 방식을 따릅니다.

## 문서화

정책이 나중에도 중요하면 아래를 기록합니다.

- 선택한 정책
- 근거 출처
- 허용 예외
- 눈에 보이는 UI 변경에 대한 검증 기대치
