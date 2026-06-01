# Translation Policy

이 저장소의 canonical 원본 언어는 영어입니다.

## 이유

- Skill description과 본문은 agent discovery와 runtime context에 직접 영향을 줍니다.
- 설치형 skill을 한 언어로 유지하면 중복 검색과 토큰 사용을 줄일 수 있습니다.
- 한국어 번역본은 사람이 읽고, 온보딩하고, 의도를 검토하는 데 유용합니다.

## 규칙

- `skills/`, `templates/`, `docs/`, `examples/`, `adapters/`는 영어로 유지합니다.
- 한국어 번역본은 `translations/ko` 아래에 둡니다.
- `translations/ko` 아래에는 `SKILL.md` 파일을 만들지 않습니다.
- 번역본을 로컬 skill 디렉터리에 동기화하지 않습니다.
- 영어와 한국어가 다르면 영어 파일을 source of truth로 봅니다.
- 영어 원본을 바꾸면 가능하면 같은 변경에서 한국어 번역도 갱신합니다.

## 이름 규칙

- 번역 markdown은 `.ko.md`를 사용합니다.
- 가능하면 `translations/ko` 아래에서 원본 경로를 보존합니다.
- Skill 번역은 설치형 skill과 혼동하지 않도록 `SKILL.ko.md`가 아니라 `<skill-name>.ko.md`를 사용합니다.
