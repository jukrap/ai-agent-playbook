# Cleanup AI Slop Checklist

## 정리 대상

- 이름만 다른 반복 helper function.
- 실제 contract에서는 발생할 수 없는 과도한 defensive branch.
- Local meaning을 알 수 있는데도 `data`, `result`, `item`, `handleThing`처럼 generic한 이름.
- Code를 그대로 반복하거나 명백한 assignment를 설명하거나 오래된 assumption을 보존하는 comment.
- Parsing, validation, I/O, rendering, formatting을 실제 이유 없이 섞은 큰 function.
- Local named value로 공유하는 편이 나은 inline constant.
- 유용한 error를 숨기는 blanket try/catch.
- Production path에 남은 mock, placeholder, sample-like logic.
- 사용하지 않는 import, variable, file, fixture, copied fragment.

## 경계

- 더 깔끔한 설계가 가능하다는 이유만으로 behavior를 바꾸지 않습니다.
- 요청에 migration work가 포함되지 않았다면 exported API, route name, public type, database field, persisted key를 rename하지 않습니다.
- 실제 duplication 또는 risk를 줄이지 않는 새 abstraction은 만들지 않습니다.
- Cleanup을 unrelated feature work와 섞지 않습니다.
- 저장소가 touched file formatting을 이미 수행하지 않는다면 formatting-only edit은 분리합니다.

## 동작 고정

아래 중 하나 이상을 사용합니다.

- touched behavior를 덮는 기존 passing test;
- 새 focused regression test;
- before/after CLI output sample;
- browser 또는 UI state check;
- parsing, rendering, data mapping이 그대로임을 보여주는 작은 fixture.

## 마무리 전 리뷰

- `git diff`에서 accidental behavior change를 확인합니다.
- Public contract와 snapshot을 건드렸다면 확인합니다.
- 설명보다 숨기는 새 helper name을 제거합니다.
- 실제 사용한 verification command 또는 manual evidence를 기록합니다.
