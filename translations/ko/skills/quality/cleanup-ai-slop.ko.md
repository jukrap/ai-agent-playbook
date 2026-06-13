# Cleanup AI Slop

신뢰가 낮아 보이는 코드를 동작 변경 없이 정리합니다.

## 진행 절차

1. 정리 범위를 file, function, component, 최근 diff 중 하나로 제한합니다.
2. Logic을 바꾸기 전에 기존 test, focused regression test, 또는 concrete manual evidence로 기대 동작을 고정합니다.
3. Dead code, redundant branch, vague name, needless abstraction, duplicated constant, misleading comment를 작은 단계로 제거합니다.
4. 사용자가 behavior change를 명시적으로 요청하지 않았다면 public contract, data shape, UI behavior, error handling, side effect를 보존합니다.
5. 가장 좁고 유용한 verification을 다시 실행하고 남은 risk를 요약합니다.

## 참고 자료

Cleanup target, boundary, verification guidance는 `references/cleanup-ai-slop-checklist.md`를 읽습니다.
