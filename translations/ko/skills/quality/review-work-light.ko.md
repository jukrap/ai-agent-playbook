# Review Work Light

인수인계 전에 놓치기 쉬운 부분을 가볍게 검토합니다.

## 진행 절차

1. 현재 diff, touched file, 관련 test 또는 docs를 확인합니다.
2. 먼저 behavior를 검토합니다: regression, edge case, data contract, state transition, error, cleanup safety.
3. 그 다음 maintainability를 검토합니다: duplication 또는 clone cue, naming, local style, documentation drift, overbroad change.
4. Verification evidence가 변경 risk와 맞는지 확인합니다. 특히 shared code 또는 generated signal을 건드렸을 때 더 주의합니다.
5. Finding을 먼저 보고합니다. Finding이 없으면 남은 test gap 또는 residual risk를 명시합니다.

## 참고 자료

Review angle과 output guidance는 `references/review-work-light-checklist.md`를 읽습니다.
