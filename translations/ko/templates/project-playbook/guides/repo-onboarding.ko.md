# 저장소 온보딩

낯선 저장소에서 계획, 편집, 프로젝트 전용 작업 흐름에 관한 답변을 하기 전에 사용합니다.

## 첫 확인

1. 브랜치, remote, dirty file, staged file을 확인합니다.
2. 루트 파일, README, 에이전트 지침, package/build config, lockfile, script를 확인합니다.
3. 패키지 관리자, 런타임 버전, test/lint/build 명령, 로컬 전용 정책을 찾습니다.
4. 관련 entrypoint를 `rg`로 검색합니다.
5. 존재하면 `ai-playbook/START_HERE.md`, `CURRENT.md`, 관련 map, 관련 runbook을 읽습니다.
6. 계획 전에 확인된 사실과 해결되지 않은 가정을 말합니다.

## 피할 것

- framework, package manager, tests, architecture, branch policy, API contract를 습관으로 추론하지 않습니다.
- 오래된 계획을 현재 코드보다 믿지 않습니다.
- repository inspection으로 답할 수 있는 질문을 사용자에게 묻지 않습니다.

## 출력 형태

```md
## 확인됨
- 스택:
- 패키지 관리자:
- 실행 명령:
- 검증:
- 로컬 전용 정책:

## 미확인
- 항목:
  - 이미 시도한 검색:
  - 중요한 이유:
```
