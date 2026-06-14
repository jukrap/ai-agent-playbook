# Review Work Light Checklist

## 리뷰 관점

- 변경된 flow의 behavior regression.
- 새 branch, failure state, migration, public contract에 대한 missing test.
- API payload, DTO, adapter, schema, persistence mismatch.
- UI overflow, loading, empty, error, disabled, focus, responsive state.
- Local-only file, generated artifact, personal path, branch name, credential, internal URL.
- Caller, behavior, test를 확인하지 않고 처리한 exact clone 또는 duplicate-code cue.
- 요청 범위를 벗어난 refactor.
- 새 behavior와 충돌하는 comment 또는 docs.
- 변경된 code와 이제 충돌하는 project vocabulary, maps, decisions.
- Shared code를 건드렸는데 skip된 verification command.

## 심각도

- **High:** runtime failure, data loss, security risk, broken public contract, destructive operation 가능성이 큼.
- **Medium:** plausible regression, missing migration, risky behavior 주변 test coverage 부족, confusing state.
- **Low:** maintainability, naming, minor docs drift, polish issue.

## 출력

- Finding을 먼저, severity 순서로 정리합니다.
- 가능하면 file과 line reference를 포함합니다.
- Summary는 짧고 부차적으로 둡니다.
- 문제가 없으면 명확히 말하고 남은 coverage gap 또는 residual risk를 언급합니다.

## 경계

- 사용자가 fix를 요청하지 않았다면 review 중 code를 다시 쓰지 않습니다.
- Repository policy와 충돌하지 않는 stylistic preference를 bug처럼 다루지 않습니다.
- Test result를 지어내지 않습니다. 실제로 실행한 check만 언급합니다.
