# Harness OS v2 Reference Adoption Queue Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn large local reference collections into a compact, read-only adoption backlog so future harness work can keep using references without copying noisy source text into prompts or public docs.

**Architecture:** Build on the existing `reference inventory` scanner. Add a scoring layer that maps signals to priority, recommended capability areas, representative file paths, and next adoption actions. Expose the result through CLI and MCP as read-only evidence.

**Tech Stack:** Dependency-free Node ESM catalog helper, existing CLI/MCP registration, Node tests, Markdown docs with Korean translations.

---

## Scope

This slice adds:

- `reference adoption-queue <reference-dir>` CLI command.
- `reference_adoption_queue` MCP read-only tool.
- Scored queue output with priorities, capability recommendations, signal highlights, representative files, and next adoption actions.
- Command/MCP docs and Korean translations.

It does not copy upstream prose, create new skills automatically, write project memory, generate embeddings, or promote references into trusted memory.

## Tasks

### Task 1: Queue Model

- [x] Reuse the existing reference inventory scan.
- [x] Score skills, agents, MCP, commands, hooks, workflows, memory, indexes, connectors, security, compliance, docs, tests, and package metadata.
- [x] Return priority buckets and recommended capability areas.
- [x] Return next adoption actions instead of raw source excerpts.

### Task 2: CLI And MCP

- [x] Add `reference adoption-queue <reference-dir> [--max-results N] [--json]`.
- [x] Add default read-only MCP tool `reference_adoption_queue`.
- [x] Keep the command and tool local-only, network-free, and no-write.

### Task 3: Tests

- [x] Extend CLI reference tests for queue scoring and read-only behavior.
- [x] Extend MCP tests for default tool exposure and read-only tool calls.

### Task 4: Docs

- [x] Update `docs/commands.md`.
- [x] Update `docs/mcp-permission-model.md`.
- [x] Update Korean translations.

### Task 5: Validate And Commit

- [x] Run syntax checks.
- [x] Run targeted CLI/MCP tests.
- [x] Run translation and public-doc validation.
- [x] Run full test suite if targeted checks pass.
- [x] Stage explicit files, inspect staged diff, and commit.
