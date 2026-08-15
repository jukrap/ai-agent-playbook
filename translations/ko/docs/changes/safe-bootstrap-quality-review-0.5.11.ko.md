# 안전한 Bootstrap과 품질 검토 0.5.11

0.5.11은 프로젝트 bootstrap의 소유 방식을 명시적으로 만들고 일반적인 UI 표현과 글 수정 충실도를 위한 읽기 전용 증거를 추가합니다.

## 기존 저장소

Root `AGENTS.md`가 있고 소유 모드를 선택하지 않으면 bootstrap은 지금처럼 모든 쓰기 전에 중단합니다. 검토한 모드 하나를 선택합니다.

```powershell
# 저장소에 제품별 지침이 이미 있을 때 권장
aapb bootstrap <target> --local-only --preserve-agents

# 짧은 playbook 읽기 순서 블록만 추가하고 관리
aapb bootstrap <target> --local-only --link-agents

# Root 정책 전체를 의도적으로 교체
aapb bootstrap <target> --replace-agents --force
```

`--force`만으로는 `AGENTS.md`를 교체하지 않습니다. 기존 root 정책과 `--profile`은 수동 통합이 필요합니다. 다른 도구가 보호 파일을 동시에 편집할 수 있다면 적용 전에 `--json`으로 확인합니다.

Local-only bootstrap은 기존 `.gitignore` byte, UTF-8 BOM 여부, 줄바꿈, 순서, 마지막 개행 여부를 유지합니다. 누락된 `.ai-agent-playbook/` 패턴 하나만 추가합니다. 보호 파일 symlink, 잘못된 managed marker, preflight snapshot drift가 발견되면 부분 설치 전에 전체 작업을 중단합니다.

설치 manifest는 선택적인 root 정책 소유권을 기록합니다. Preserved 정책은 관리하지 않고 linked 정책은 marker 블록만 소유하므로 managed check와 uninstall이 주변 사용자 내용을 그대로 둡니다. 기존 manifest도 계속 읽을 수 있습니다.

## 검토 도구

`qa ui-genericity-scan`은 반복되는 template형 UI 표현 중 신뢰도가 높은 정적 후보를 제한된 범위에서 찾습니다. 의미 기반 rule ID는 gradient, glow·glass, pill, 중첩 card, radius·shadow 누적, 장식형 stat, 일률적인 hover transform, kicker, 상투적인 claim의 조합을 다룹니다. 결과는 확정 결함이 아닌 후보입니다. 수정하거나 완료를 주장하기 전에는 제품 문맥과 실제 desktop/mobile 렌더링 증거가 계속 필요합니다.

`writing fidelity-check`는 대상 안의 수정 전후 글을 비교합니다. 변경 범위와 수치, 버전, URL, 명령, 경로, 코드, 식별자, 경고, 문서 구조, 한국어 register, 반복 수사 구조의 변화를 보고합니다. 동등한 수치 표기는 정규화합니다. 보고서는 증거일 뿐 고정 비율로 의도적인 수정을 거절하지 않습니다.

두 검사는 모두 읽기 전용이며 기본 MCP surface에서도 `qa_ui_genericity_scan`과 `writing_fidelity_check`로 사용할 수 있습니다. Source text를 실행하거나 외부 rule module을 불러오거나 파일을 수정하거나 저자성을 추정하거나 detector 우회 기능을 제공하지 않습니다.

## 참고 자료 출처

- UI 검토 원칙은 [`kill-ai-slop`](https://github.com/yetone/kill-ai-slop) revision `96d1ca568a1db7e1ef9a381644c744440f816ee4`(Apache-2.0)을 바탕으로 독립적으로 재구성했습니다.
- 글 검토 원칙은 [`im-not-ai`](https://github.com/epoko77-ai/im-not-ai) revision `53e24e8f92cf344efcb812103f7c2b203e7efffc`(MIT)을 바탕으로 독립적으로 재구성했습니다.
- 별도의 writing 중심 harness에서는 수치 보존, register, 수사 구조, 변경 범위 검수 원칙만 참고했습니다. Fiction voice, canon, candidate 승인 흐름은 가져오지 않았습니다.

외부 scanner 구현, 숫자 taxonomy, website asset, 고유 문구와 구성은 포함하지 않았습니다. 참고 자료에서는 검토 원칙만 얻었으며 이 저장소는 자체 의미 규칙, 코드, test, 문서, 개발 도구 경계를 사용합니다.

## 호환성

- 기존 bootstrap의 안전 기본값은 유지합니다. `AGENTS.md`가 이미 있을 때 mode를 선택하지 않으면 쓰지 않습니다.
- 기존 설치 manifest를 계속 읽으며 새로운 ownership field는 선택 사항입니다.
- Naturalness finding은 이제 반복 또는 문맥상 밀도를 요구하고 동등한 JavaScript/Python 결과를 합칩니다.
- 공개 기능은 의미 기반 command와 rule name을 사용합니다. `schemaVersion`은 기계 호환성에 필요한 곳에만 유지합니다.
