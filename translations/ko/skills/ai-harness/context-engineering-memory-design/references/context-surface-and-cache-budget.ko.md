# Context Surface And Cache Budget

AI harness에서 guidance, fact, reference, report, generated output을 어디에 둘지 결정할 때 사용합니다.

## Surface Placement

- Always-on rules: 대부분의 작업에 적용되는 작고 안정적인 behavior-shaping instruction.
- Project-local context: current fact, policy, map, contract, glossary, decision, active work state.
- Skill references: trigger가 적용될 때만 읽어야 하는 task-specific detail.
- Runtime evidence: generated report, index, graph, dry-run output, diagnostic, search result.
- Archive: 명시적으로 검색하지 않는 한 current behavior를 지시하지 않는 historical note.

## Budget Rules

- Default prompt context에 large reference inventory, source list, raw excerpt, generated report를 추가하지 않습니다.
- 긴 guidance를 skill body에 복사하기보다 routing rule과 reference file을 우선합니다.
- 매 turn 바뀌는 mutable context를 always-on instruction에 넣지 않습니다.
- Tool list와 prompt surface는 budgeted API surface입니다. 반복 작업을 줄이거나 structured evidence를 가능하게 할 때만 추가합니다.

## Cache-Safe Changes

- Stable rule은 ad hoc chat memory가 아니라 source docs와 template에 둡니다.
- 새 capability는 하나의 긴 instruction block에 숨기지 않고 catalog, recipe, prompt, skill로 discoverable하게 만듭니다.
- Context surface가 크면 agent가 언제 읽을지 알 수 있도록 selection criteria를 추가합니다.
- Change가 default context를 키우면 benefit이 충분히 넓은 이유를 기록합니다.

## Stop Conditions

- 제안이 raw reference dump나 generated evidence를 always-on context에 넣습니다.
- 같은 fact가 owner 없이 여러 trusted location에 존재합니다.
- Context change에 secret, personal path, internal URL, branch name, PR number가 들어갑니다.
- 드문 capability를 쓰기 위해 agent가 매 turn 긴 파일을 읽어야 합니다.
