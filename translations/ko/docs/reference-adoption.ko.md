# Reference Adoption

외부 reference는 유용하지만, 일상 agent prompt에 긴 출처 목록이 그대로 남으면 노이즈가 됩니다. Reference는 local capability, recipe, 간결한 reference로 정제해서 채택합니다.

## Adoption Steps

1. 원본 자료를 inventory로 정리합니다.
2. 각 항목을 capability category로 분류합니다.
3. 오래 쓸 practice, constraint, verification check를 추출합니다.
4. 짧은 trigger guidance는 `SKILL.md`에 둡니다.
5. 재사용 세부사항은 `references/`에 둡니다.
6. 반복 가능한 절차는 workflow recipe로 추가합니다.
7. 주요 설계 결정은 docs나 worklog에 기록합니다.

## Keep Out

- 개인 absolute path.
- 회사명과 내부 URL.
- credential, token, branch name, issue number, PR number.
- trigger 시점에 유용하지 않을 만큼 긴 raw copied reference.

