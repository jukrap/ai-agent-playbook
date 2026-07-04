# 자연스러운 글 다듬기

사실, 의미, 기술 용어, 작성 의도를 보존하면서 한국어 또는 영어 글을 자연스럽게 다듬습니다.

## 작업 흐름

1. 언어, 독자, 문서 종류를 확인하고 가벼운 교정인지, 번역투 정리인지, 전체 재작성인지 구분합니다.
2. 사실, 숫자, 이름, 날짜, 경고, 배포 범위, 법적 의미, 기술 계약은 먼저 고정합니다.
3. 로컬 파일이 있으면 `aapb writing naturalness-check <target> --path <file> --lang auto --engine auto --json`으로 문체 신호를 확인합니다.
4. 기계적인 표현, 번역투, 억지 대칭, 과한 주장, 반복되는 문장 리듬을 줄입니다.
5. 작성자의 말투, 도메인 용어, 필요한 단호함은 남깁니다. 모든 문장을 마케팅 문구처럼 매끈하게 만들지 않습니다.
6. 탐지 우회, 평가 회피, 허위 저자성, 정책 회피 목적의 요청은 거절합니다.

## 참고 문서

한국어 번역투, 영어 용어 밀도, 자연스러운 한국어 점검은 `references/korean-naturalness-patterns.md`를 읽습니다.

영어권 AI식 표현, 늘어진 문장 리듬, 담백한 영어 다듬기는 `references/english-naturalness-patterns.md`를 읽습니다.

의미 보존, 안전 경계, 과한 윤문 방지는 `references/voice-fidelity-and-boundaries.md`를 읽습니다.

문서, README, PR 본문, 배포 노트, 번역본을 마무리하기 전에는 `references/review-rubric.md`를 읽습니다.
