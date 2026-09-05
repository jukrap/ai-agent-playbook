# 일반적인 UI 검토 후보와 증거

## 제품 적합성부터 확인

제품 유형, 핵심 작업, 예상 정보 밀도, 입력 방식, 중요한 화면 크기를 기록합니다. 대시보드, 편집기, 상점, 캠페인 페이지는 같은 시각 장치를 서로 다른 이유로 사용할 수 있습니다. 기존 브랜드 토큰과 정착된 컴포넌트는 제거할 잡음이 아니라 제약입니다.

## 정적 후보 규칙

`aapb qa ui-genericity-scan`은 다음 의미 기반 규칙 ID를 간결하게 보고합니다.

- `visual.gradient-text`: 텍스트에 gradient clipping이 직접 적용됨
- `visual.ambient-glow`: 한 파일에 비대화형 blur 또는 glow 장식이 여러 번 나타남
- `visual.glass-surface`: blur와 반투명 배경이 결합됨
- `shape.pill-taxonomy`: pill 모양 badge 또는 status 표현이 분류 체계처럼 반복됨
- `layout.nested-cards`: 카드형 컴포넌트 안에 같은 유형의 표면이 중첩됨
- `shape.radius-shadow-stack`: 한 표면에 큰 radius와 무거운 shadow가 함께 적용됨
- `content.decorative-stats`: 큰 통계 표현이 여러 개 함께 나타남
- `motion.uniform-hover-transform`: 같은 scale 또는 translation hover 표현이 반복됨
- `content.repeated-kicker`: 대문자와 넓은 자간의 kicker 표현이 반복됨
- `copy.generic-marketing-claims`: 제품 근거가 없는 일반적인 주장이 여러 번 나타남

이 항목들은 자동 확정된 결함이 아니라 검토 후보입니다. 의도적인 gradient, badge, hover 상태가 한 번 사용된 경우에는 집계 규칙이 반응하지 않아야 합니다. 생성물, 의존성, lockfile, minified 자산, 로컬 참고 자료, 작업 디렉터리, playbook runtime 파일은 제외합니다.

## Suppression

렌더링을 확인해 표현이 의도적이라고 판단한 뒤에만 소스 주석에 `ui-review-ignore <rule-id>`를 사용합니다. suppression은 파일 단위이고 내장 규칙 ID만 허용합니다. 외부 규칙 모듈을 불러오거나 실행하지 않습니다.

## 검토 질문

- 이 표현이 정보 탐색, 비교, 입력, 확인을 돕는가?
- 시각 강조가 작업 중요도에 비례하는가?
- 반복이 위계를 만드는가, 아니면 모든 요소를 비슷하게 보이게 하는가?
- 의미를 잃지 않고 레이어, 테두리, 그림자, badge, 마케팅 문구 하나를 덜어낼 수 있는가?
- 제안한 변경이 기존 브랜드 표현과 접근성 상태를 보존하는가?

## 증거

확인된 문제에는 규칙 ID 또는 관찰 증상, 대상 화면, 화면 크기, 사용자 영향, 렌더링된 스크린샷이나 영상을 기록합니다. 변경 후에도 같은 상태와 화면 크기를 비교합니다. 검사 결과가 0건이라는 사실만으로 UI 완료를 증명하지 않습니다.

## 수정 인수인계

검토만 요청받았다면 근거와 권장 사항을 보고한 뒤 멈춥니다. 구현이 허용되면 확인된 문제, 제품 제약, 영향받는 화면 크기, 기대 결과를 `ui-polish` 또는 저장소 UI 흐름으로 넘깁니다. 위계를 되찾는 데 필요한 가장 작은 반복 표현부터 제거하거나 단순화하고, 의도적인 브랜드 표현이나 관련 없는 화면을 평평하게 다시 설계하지 않습니다.
