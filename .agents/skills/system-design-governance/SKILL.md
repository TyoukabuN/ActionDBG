---
name: system-design-governance
description: Use when Codex starts a new feature, gameplay system, Unity subsystem, tool, service, module, or architecture design from requirements before implementation. Guides PRD, architecture, constraints, implementation planning, code-readiness review, phased implementation, verification, progress tracking, and decisions. Use when the user wants AI to design a new program/game system accurately before writing code, avoid over-engineering, or turn a rough idea into an implementable system plan.
---

# System Design Governance

Use this skill to turn a rough new-system request into a controlled engineering workflow. Do not start by coding unless the user explicitly asks to skip design.

## Core Rule

Separate product intent, architecture, constraints, implementation plan, progress, and decisions. Treat documents as the source of truth; do not rely on long conversation history.

## Source Of Truth

Prefer current facts in this order:

1. Current source code.
2. `constraints.md` / `Constraints.md`.
3. `architecture.md` / `Architecture.md`.
4. `PRD.md` or the feature PRD.
5. `implementation-plan.md` / `ImplementationPlan.md`.
6. `progress.md` / `Progress.md`.
7. `decisions.md` / `Decisions.md`.
8. Conversation history.

If documents conflict, prefer source code for implemented behavior, `progress.md` for current status, and `decisions.md` for durable choices. State the conflict before acting.

## Document Responsibilities

- `PRD.md`: What to build, why it matters, user/system behavior, scope, non-goals, acceptance criteria.
- `Architecture.md`: System boundaries, responsibilities, module relationships, data flow, lifecycle, dependencies, extension points, failure cases.
- `Constraints.md`: Environment, compatibility, performance, network/storage/editor/runtime limits, forbidden approaches, coding rules.
- `ImplementationPlan.md`: Phases, task order, affected files, migration/setup steps, validation per phase.
- `Progress.md`: Completed work, current phase, next task, blocked items, known unverified risks.
- `Decisions.md`: Durable decisions, rejected alternatives, rationale, consequences.

For large systems, add focused files only when useful:

- `DangerousPatterns.md` or `*-dangerous-patterns.md`: Searchable risky APIs, legacy patterns, or forbidden code shapes.
- `DefinitionOfDone.md` or `definition-of-done.md`: Completion gate for this system.
- `design/`: Detailed technical designs too large for `Architecture.md`.
- `implementation-logs/`: Session-level logs when work spans many iterations.

## Workflow

### 1. Clarify Requirements

If the request is vague or high-risk, ask concise questions before writing docs or code. Otherwise state assumptions and proceed.

Capture in PRD:

- Goal and user/system value.
- Functional requirements.
- Non-goals.
- Edge cases and failure behavior.
- Acceptance criteria.

Do not put class layouts, managers, factories, or implementation details in the PRD unless they are part of externally visible requirements.

### 2. Design Architecture Before Code

Before implementation, produce or update architecture with:

- Responsibilities and ownership boundaries.
- Module/class roles at a conceptual level.
- Data flow and lifecycle.
- Dependency direction.
- Extension points.
- Failure cases and recovery behavior.
- Performance and allocation risks.
- Runtime/editor/build/network/storage impact when relevant.

When multiple reasonable designs exist, compare them and record the selected one in `Decisions.md`. Do not silently choose a high-complexity architecture.

### 3. Define Constraints

Use `Constraints.md` to prevent unwanted implementation choices. Include only constraints that matter for the system.

Good constraints are concrete:

- "Gameplay assembly must not depend on Editor."
- "Runtime update path must allocate 0 GC."
- "Do not use global singleton unless existing project pattern requires it."
- "Do not call `GetComponent` per frame."
- "Network messages must remain backward compatible."

Avoid broad advice that does not change implementation choices.

### 4. Plan Implementation

Create or update `ImplementationPlan.md` before coding. Split work into phases small enough to implement and verify independently.

Each phase should include:

- Goal.
- Files/modules likely affected.
- Steps.
- Completion criteria.
- Validation.
- Risks or dependencies.

Implement one phase or one clear task at a time unless the user explicitly asks for a broader pass.

### 5. Read Existing Code

Before editing an existing project:

1. Read relevant docs.
2. Search and read relevant source code.
3. Explain current behavior briefly.
4. Identify affected files/classes.
5. Identify conflicts between desired architecture and existing code.
6. State the implementation approach and validation.

Then implement if the user asked for execution. If the request is exploratory or asks for confirmation, stop after the plan.

### 6. Implement Conservatively

- Follow existing project patterns and ownership boundaries.
- Add abstractions only when they remove real complexity or match local architecture.
- Keep changes scoped to the current phase.
- Do not rewrite unrelated systems.
- Do not create manager/factory/provider/resolver layers unless the architecture justifies them.
- Prefer simple data flow and explicit lifecycle over hidden global state.

### 7. Verify

After implementation, run validation appropriate to the project:

- Compile/build relevant projects.
- Run tests if available.
- Run static searches for constraints or dangerous patterns if defined.
- Review git diff against PRD, Architecture, Constraints, and ImplementationPlan.
- Check acceptance criteria.
- Record unverified risks explicitly.

For Unity/game systems, consider whether Editor, PlayMode, build/dev package, network sync, serialization, asset references, and profiler/performance paths need separate validation.

### 8. Update Project State

After implementation:

- Update `Progress.md` with completed work, current phase, next task, blocked/unverified items.
- Update `Decisions.md` for durable choices or rejected alternatives.
- Update `Architecture.md` only for stable architecture changes.
- Update `Constraints.md` only for lasting constraints.
- Update `ImplementationPlan.md` when phase order, scope, or completion criteria change.
- Update PRD only when requirements, scope, non-goals, or acceptance criteria change.

## Pre-Code Checklist

Before writing code, confirm:

- PRD exists or assumptions are stated.
- Architecture exists for non-trivial systems.
- Constraints are known.
- Implementation plan is phased.
- Existing code has been read.
- Affected files/classes are identified.
- Validation is defined.

## Final Response

End with:

- What was designed or implemented.
- Which docs were created or updated.
- Which validation ran or could not run.
- Current risks and next phase.
