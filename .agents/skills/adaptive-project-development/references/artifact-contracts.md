# Artifact Contracts

Use this reference to keep documents distinct, traceable, and reviewable. Adapt headings to established repository conventions; preserve the responsibility boundaries.

## Shared Metadata

For multi-session Standard or Full work, use compact metadata when the repository has no equivalent:

```yaml
status: draft | ready | implementing | verified | superseded
track: quick | standard | full
owner: human-and-lead | lead | worker
last_updated: YYYY-MM-DD
```

Do not add metadata that no workflow step consumes.

## PRD Contract

The PRD defines what must be true and why it matters.

Include:

- problem, goal, and user/system value;
- observable functional requirements;
- scope and non-goals;
- edge cases and failure behavior;
- acceptance criteria and unresolved product questions.

Exclude:

- class/module layouts;
- framework or library choices unless externally constrained;
- file-by-file edits;
- implementation order and worker assignments.

For non-trivial work, assign stable IDs:

- `FR-001` for functional requirements;
- `NFR-001` for measurable non-functional requirements;
- `AC-001` for acceptance criteria.

## Design Contract

Design defines how the system will satisfy the approved PRD without becoming an execution checklist.

Include when relevant:

- current and target behavior;
- system boundary and responsibility ownership;
- module relationships and dependency direction;
- state machine, data flow, event ordering, and time model;
- public/internal contracts and data shapes;
- initialize/start/update/stop/restart or equivalent lifecycle;
- error, cancellation, focus loss, recovery, and teardown behavior;
- performance/resource risks and compatibility impact;
- alternatives, selected decisions, and consequences;
- mapping to `FR-*`, `NFR-*`, and `AC-*`.

Exclude:

- exhaustive task lists;
- line-level edit instructions;
- copied PRD prose;
- speculative abstractions that do not solve an identified requirement.

Use diagrams only when sequence, state, dependency, or ownership is materially clearer than prose.

## Implementation Plan Contract

The plan converts approved design into verifiable phases.

Each phase should state:

- goal and upstream requirement/design references;
- likely files or modules affected;
- ordered implementation steps;
- dependencies and risks;
- completion criteria;
- focused validation and expected evidence.

The plan may identify likely file paths, but it should not duplicate full task prompts. For Standard work, the plan may be the only execution checklist.

## Tasks Contract

Create Tasks only when work must be independently assigned, resumed, or reviewed.

Each task requires:

- immutable task ID and concise title;
- one concrete outcome;
- requirement, acceptance, design, and plan references;
- dependencies;
- allowed files/modules or write set;
- required changes and explicit non-goals;
- validation commands/manual checks;
- stopping conditions for invalid assumptions or scope expansion;
- status and completion evidence.

Use statuses such as `pending`, `ready`, `in_progress`, `blocked`, `implemented`, and `verified`. Only the lead/reviewer marks `verified` after inspecting changes and evidence.

## Verification Contract

Verification records observed evidence, not expected behavior.

For each in-scope acceptance criterion record:

| Acceptance | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `AC-001` | `PASS` / `FAIL` / `NOT RUN` | Command, test, screenshot, or manual scenario | Limitations |

Also record:

- revision or branch reviewed;
- actual commands and exit results;
- manual/browser environment when relevant;
- diff/scope review outcome;
- unresolved failures and unverified risks.

Do not call an item verified because a task checkbox is checked or a worker reported success.

## Change Propagation

- Requirement or acceptance change: update PRD, then Design, Plan, Tasks, and Verification mappings.
- Technical approach change without behavior change: update Design, then Plan and affected Tasks.
- Execution-order change: update Plan and Tasks only.
- Implementation discovery: record evidence, then update the earliest artifact whose assumption was wrong.
- Completed behavior differing from PRD is a defect or approved requirement change, never an undocumented implementation detail.
