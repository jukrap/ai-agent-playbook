# Release Notes Changelog

배포되었거나 예정된 변경을 commit history 복사가 아니라 reader-facing release artifact로 바꿉니다.

## 작업 흐름

1. Reader를 확인합니다. user, support, operator, developer, maintainer, stakeholder, migration owner 중 누구인지 구분합니다.
2. User impact, operational impact, migration impact, known issue, rollback 또는 support note 기준으로 변경을 묶습니다.
3. Verified behavior를 implementation detail, commit title, worklog note, generated summary와 분리합니다.
4. 관련되면 risk, caveat, compatibility, migration, rollback, monitoring note를 포함합니다.
5. 검토된 evidence와 실제 verification result만 인용합니다. Test나 release status를 지어내지 않습니다.
6. Private path, credential, internal URL, branch name, PR number, noisy reference name을 artifact에서 제외합니다.

## Reference

Release artifact 구조와 reader detail을 고를 때는 `references/release-note-audience-checks.md`를 읽습니다.

Risk, known issue, migration, rollback, verification evidence를 문서화할 때는 `references/changelog-risk-and-rollback.md`를 읽습니다.
