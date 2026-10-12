---
name: adaptive-project-development
description: Guide end-to-end feature and project-slice development with a complexity-adaptive workflow from PRD through technical design, implementation planning, task decomposition, bounded implementation, and independent review. Use for new features, gameplay systems, cross-module changes, or multi-session work where Codex must decide which artifacts and gates are necessary. Do not use for explanation-only requests, research-only tasks, or a narrowly scoped code fix that already has an approved design and plan.
---

# Adaptive Project Development

Use the lightest workflow that keeps intent, design, implementation, and evidence aligned. Roles describe responsibilities; they do not require separate agents.

## Start With Scope And Authority

1. Read applicable `AGENTS.md` files, inspect `git status`, and preserve user-owned changes.
2. Read the project vision, relevant requirements and design documents, current architecture/constraints/decisions, and the source needed to understand existing behavior.
3. Identify the highest stage the user authorized. A request for a PRD or proposal does not authorize design, planning, code changes, delegation, commits, pushes, or external publication.
4. State the selected workflow track, intended artifacts, assumptions, and validation before writing.

Read [workflow-routing.md](references/workflow-routing.md) whenever selecting or changing a track.

## Select A Track

- **Quick:** A local, low-risk feature using established behavior and architecture. Use `PRD -> Implementation -> Review`.
- **Standard:** A multi-file or multi-module feature with known architecture that benefits from phased execution. Use `PRD -> Implementation Plan -> Implementation -> Review`.
- **Full:** A new system, state machine, lifecycle, data contract, migration, cross-cutting change, or multi-worker effort. Use `PRD -> Design -> Implementation Plan -> Tasks -> Implementation -> Review`.

Do not create omitted artifacts as empty placeholders. Escalate the track before further implementation when new uncertainty, coupling, or risk appears. Do not downgrade merely because implementation has already started.

## Artifact Dependency

Each downstream artifact must consume, not restate, its upstream contract:

```text
PRD (what and why)
  -> Design (how the system works)
  -> Implementation Plan (phases and change map)
  -> Tasks (bounded executable units)
  -> Code and tests
  -> Verification (acceptance evidence)
```

- Keep stable requirement and acceptance IDs such as `FR-001` and `AC-001` when more than one downstream artifact needs traceability.
- Link downstream artifacts to those IDs instead of duplicating full requirements.
- When requirements change, update the PRD first, then repair affected downstream artifacts before continuing.
- Follow existing repository locations and naming. For a new convention, prefer one feature/change directory containing its artifacts; do not migrate unrelated documents for tidiness.

Read [artifact-contracts.md](references/artifact-contracts.md) before creating or materially revising any workflow artifact. Reuse the templates under `assets/templates/` when they match the repository's conventions.

## Stage Gates

Stop at the user's authorized stage. Before advancing, apply the matching gate:

1. **Requirements Ready:** scope, observable behavior, non-goals, edge cases, and acceptance criteria are clear enough to evaluate.
2. **Design Ready:** responsibilities, state/data flow, lifecycle, failures, constraints, and significant decisions are coherent and traceable to requirements.
3. **Implementation Ready:** phases, affected areas, dependencies, validation, and risks are explicit; no blocking design question is hidden in the plan.
4. **Task Ready:** each task has a bounded outcome, dependencies, write set, requirement/design references, validation, and stopping conditions.
5. **Verified:** the actual diff and executed checks provide evidence for every in-scope acceptance criterion; failures and checks not run remain explicit.

Read [readiness-and-review.md](references/readiness-and-review.md) for gate checks and verification evidence.

## Roles And Handoffs

- **Product responsibility:** the user and lead agent own intent, priorities, scope, and acceptance criteria.
- **Architect responsibility:** the high-capability lead agent owns technical design, tradeoffs, compatibility, and readiness.
- **Planner responsibility:** normally the same lead agent decomposes the approved design; do not spawn a planner merely to imitate a role name.
- **Worker responsibility:** a worker implements one ready task or a tightly related task set without redesigning the system.
- **Reviewer responsibility:** the lead agent independently inspects the actual changes and validation. Do not accept a worker's completion claim as evidence by itself.

When worker delegation is authorized and supported, use the project's implementation-worker skill or contract. For projects with `sol-luna-dev`, hand off only Task Ready work to Luna and return control to the lead for review. Never claim a particular worker model without evidence.

Read [role-handoffs.md](references/role-handoffs.md) before delegating implementation or review.

## Implementation And Change Control

- Implement only approved scope and one plan phase or task at a time unless the user authorizes a broader pass.
- Preserve repository conventions and user-owned changes; avoid unrelated refactors and speculative frameworks.
- If implementation exposes an invalid assumption, stop the affected task, update the owning artifact, re-run downstream gates, and then resume.
- Keep product requirements in the PRD, system mechanics in Design, execution order in the Implementation Plan, task status in Tasks, and observed results in Verification.
- A checked task means its change and task-level validation completed; it does not mean the feature passed final acceptance review.

## Project Profiles

Apply repository-specific rules over generic defaults. For ActionDBG work, read [actiondbg-profile.md](references/actiondbg-profile.md) before choosing paths, language, gameplay scope, or validation.

## Completion Report

Report:

- selected track and completed stage;
- artifacts and code changed;
- requirement/acceptance coverage;
- validation as `PASS`, `FAIL`, or `NOT RUN`;
- deviations, open decisions, and the next authorized stage;
- branch, commit, PR, or deployment links only when they actually exist and were verified.
