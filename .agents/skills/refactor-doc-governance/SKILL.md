---
name: refactor-doc-governance
description: Use when Codex works on long-running refactors, migrations, architecture changes, or PRD-driven implementation where project documents such as PRD.md, architecture.md, constraints.md, implementation-plan.md, progress.md, decisions.md, dangerous-patterns.md, definition-of-done.md, migration-lists/, implementation-logs/, or issues/ should guide coding and record keeping. Also use when the user asks to update PRD/docs during implementation, avoid PRD bloat, preserve refactor context across compressed conversations, or turn scattered logs/issues into executable checklists.
---

# Refactor Doc Governance

Use this skill to keep long-running refactors accurate, auditable, and resistant to context loss. Treat the skill as process memory only; keep project facts in the project documentation.

## Core Rule

Do not use the main PRD as an execution log. Update the document that owns the information.

If documentation is bloated, migrate durable content to the responsible document and replace the original section with a short summary plus links. Do not delete historical context unless the user explicitly asks for deletion.

## Document Responsibilities

Minimum document set:

- `PRD.md`: Record what to build, why, scope, non-goals, priority, and acceptance criteria.
- `architecture.md` or `Architecture.md`: Record stable system shape, module responsibilities, data flow, ownership boundaries, and invariants.
- `constraints.md` or `Constraints.md`: Record technical limits, compatibility requirements, forbidden changes, and operational constraints.
- `implementation-plan.md` or `ImplementationPlan.md`: Record the staged implementation plan and task order.
- `progress.md` or `Progress.md`: Record current status, completed work, next steps, and blocked items.
- `decisions.md` or `Decisions.md`: Append durable decisions, alternatives rejected, and rationale.

Large refactor additions:

- `dangerous-patterns.md` / `*-dangerous-patterns.md`: Record old APIs, legacy semantics, risky calls, and exact search commands/check rules. Also check paths such as `migration-lists/*dangerous-patterns*.md`.
- `definition-of-done.md`: Record task completion checks, required validation, and acceptable unverified-risk reporting.
- `migration-lists/`: Track concrete migration targets and per-item status.
- `implementation-logs/`: Record what changed in a specific work session, validation run, and remaining risk.
- `issues/`: Record out-of-scope bugs, follow-up audits, and independent investigations.

## Start Of Work

Before making code changes:

1. Locate the task documentation folder from the user prompt or nearby project docs.
2. Read the task `README.md` first if present.
3. Read `progress.md` / `Progress.md` early if present; treat it as the current-status source unless README explicitly says otherwise.
4. Read `architecture.md` and `constraints.md` if present.
5. Read `definition-of-done.md` and any dangerous-patterns file if present.
6. Read the main PRD only for goals, scope, non-goals, phase summary, and acceptance criteria.
7. Read only task-relevant design files, migration lists, logs, and issues.
8. If no README exists, infer the entrypoint from the closest PRD, architecture, plan, or progress file and state that assumption.

If the user asks to "update the PRD" or "make records", interpret that as updating the responsible documents, not necessarily the main PRD.

Recognize filename variants case-insensitively: `PRD.md`, `Architecture.md`, `Constraints.md`, `ImplementationPlan.md`, `implementation-plan.md`, `Progress.md`, `Decisions.md`, `definition-of-done.md`, `dangerous-patterns.md`, `*-dangerous-patterns.md`, and `migration-lists/*dangerous-patterns*.md`.

## Pre-Implementation Output

For non-trivial refactor work, state a short impact analysis before editing:

- Affected modules and files.
- Legacy semantics or dangerous patterns to search.
- Runtime/editor/build/network/serialization impact if relevant.
- Validation expected before final response.

If the user explicitly wants immediate implementation, keep this analysis concise and continue.

## Implementation Rules

- Keep edits scoped to the current task and existing architecture.
- Prefer existing project patterns over new abstractions.
- Convert scattered issue/log lessons into reusable rules when they affect future work.
- When moving information between docs, preserve it first, then replace the source with a summary and link.
- Do not delete legacy paths unless the current plan or constraints explicitly allow it.
- Mark intentional exceptions with clear status such as `KEEP_LEGACY`, `KEEP_EDITOR`, or `DEFERRED` when the project already uses those labels.

## Document Normalization

When asked to organize, extract, slim, or normalize a refactor document set:

1. Map existing documents to their responsibilities before editing.
2. Identify current-state conflicts; make `progress.md` the current-status source and mark older status blocks as historical snapshots.
3. Move long phase/task details from the main PRD to `implementation-plan.md`; keep a phase summary table and links in the PRD.
4. Move API sketches, class layouts, algorithms, and technical tradeoffs from the PRD to `design/` unless they are only a short architecture summary.
5. Move stable invariants to `architecture.md`, restrictions to `constraints.md`, decisions to `decisions.md`, repeatable checks to dangerous-patterns files, and session history to `implementation-logs/`.
6. Update README after entrypoints or reading order change.
7. Add an implementation log for the normalization itself.
8. Validate relative links from README and any edited index files.

Use summaries that state what moved and where; avoid leaving duplicate long-form content in both the source and destination.

## Dangerous Pattern Handling

When a dangerous-patterns file exists, including `dangerous-patterns.md`, `*-dangerous-patterns.md`, or `migration-lists/*dangerous-patterns*.md`:

1. Run or adapt the listed searches for the touched area.
2. Classify each hit as runtime, editor-only, legacy, false positive, or deferred.
3. Fix runtime violations that are in scope.
4. Record deferred or intentional hits in the relevant migration list, issue, or implementation log.

When repeated bugs appear in `issues/` or logs but no dangerous-patterns file exists, propose or create one if the task scope includes documentation maintenance. Prefer a scoped name such as `runtime-dangerous-patterns.md` when the checklist is domain-specific.

## Definition Of Done

When `definition-of-done.md` exists, use it as the completion gate. Otherwise apply this default:

- Relevant code compiles or the reason compilation was not run is stated.
- Relevant dangerous-pattern searches were run or the reason they were not run is stated.
- Runtime/editor/build/network/serialization paths touched by the change were considered.
- Documentation was updated by responsibility.
- Edited README/index relative links resolve.
- Major heading numbering or table-of-contents entries remain coherent after document moves.
- Unverified risks are recorded explicitly instead of being implied.

## Documentation Update Routing

After implementation:

- Update `PRD.md` only for changes to requirements, scope, non-goals, phase plan, or acceptance criteria.
- Update `architecture.md` only for durable architecture facts or invariants.
- Update `constraints.md` only for lasting restrictions or compatibility rules.
- Update `implementation-plan.md` only for staged plan changes.
- Update `progress.md` for current state and next action.
- Update `decisions.md` for durable decisions and rationale.
- Update the applicable dangerous-patterns file for repeatable search/check rules.
- Update `definition-of-done.md` for completion-gate changes.
- Update `migration-lists/` for concrete migration target status.
- Update `implementation-logs/` for session-level changes and validation.
- Update `issues/` for out-of-scope or follow-up problems.
- Update `README.md` only for index/current-status changes.

## Final Response

End with:

- What changed.
- Which validations ran or could not run.
- Which documents were updated and why.
- Any remaining risk or follow-up item.
