# Pragmatic FSD

Use this guide only when the project already uses Feature-Sliced Design or a similar layered frontend architecture.

## Apply when

- Existing code follows FSD boundaries.
- Project docs explicitly require FSD.
- The change touches slices, entities, features, widgets, or shared layers.

## Do not apply when

- The project is small and has no layered convention.
- The codebase uses a different architecture.
- Adding FSD would be a broad restructure unrelated to the task.

## Rules

- Follow existing layer names and import direction.
- Keep public APIs explicit through local index files only when the project already uses that convention.
- Avoid deep imports into internal files.
- Do not create a new slice for one-off code unless it has a clear product responsibility.
- Prefer local consistency over textbook purity.

Document durable architecture decisions in `.ai-playbook/decisions/` or the project's architecture docs.
