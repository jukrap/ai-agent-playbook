# Figma Handoff Contract

## Artifact Identity

다음을 기록합니다.

- file 또는 frame identity,
- design owner 또는 source status,
- 가능한 경우 version 또는 timestamp,
- target screen과 state,
- linked token, variable, component, variant,
- unsupported 또는 stale frame.

Project-approved access method를 사용합니다. Private Figma URL, personal token, client-only name을 public docs에 넣지 않습니다.

## Inspection

다음을 검사합니다.

- page와 frame hierarchy,
- component instance와 variant prop,
- token variable과 mode,
- text style과 local override,
- auto-layout behavior,
- constraint와 resizing,
- interactive prototype link,
- exported asset과 source of truth,
- implementation에 영향을 주는 comment 또는 design note.

## Mapping

Figma concept을 repository로 매핑합니다.

- Variable 또는 token style -> existing semantic token 또는 migration proposal.
- Component variant -> existing component prop, slot, state, new variant name.
- Auto-layout -> CSS layout rule, grid/flex constraint, content-fit behavior.
- Prototype transition -> route, state, animation, motion contract.
- Asset -> source-controlled asset, generated asset, runtime media, external source.

## Review Gates

- Source frame은 구현할 만큼 최신입니다.
- Shared component는 올바른 layer에서 확장됩니다.
- Theme mode, density, long content, responsive constraint가 포함됩니다.
- Frame에 없더라도 accessibility state를 지정합니다.
- Screenshot 또는 visual check로 implementation이 agreed contract와 일치함을 증명할 수 있습니다.
