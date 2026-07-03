# Frontend UI Polish

Primary route: `frontend/ui-polish`.

실제 제품 맥락에 맞게 보이는 UI를 다듬습니다.

## 진행 절차

1. 기존 화면, 주변 컴포넌트, design system, token, CSS convention, 대상 사용자를 확인합니다.
2. 사용자가 완료해야 하는 workflow를 먼저 파악하고, 그 workflow 주변의 hierarchy, spacing, layout stability, state coverage, responsive behavior를 개선합니다.
3. 저장소의 스타일 정책을 보존합니다. 스타일 관례가 불명확하거나 충돌하면 `style-policy-selection`을 사용합니다.
4. 사용자가 새 visual direction을 요청하지 않았다면 decorative redesign을 피합니다.
5. 가능하면 rendered UI 또는 browser evidence로 변경된 surface를 검증합니다.

## 참고 자료

상세 UI polish criteria와 verification guidance는 `references/frontend-ui-polish-checklist.md`를 읽습니다.
