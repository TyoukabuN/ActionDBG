# Workflow Routing

Use this reference to select the minimum safe workflow and to decide when to escalate it.

## Routing Principles

Classify the work by the strongest risk signal, not by the user's adjective or file count alone. A one-file state-machine change can require Full rigor; a broad mechanical rename can remain Quick.

Do not require feature-governance artifacts for explanation, research, status reporting, routine dependency-free maintenance, or a narrow bug fix whose intended behavior and implementation boundary are already established.

## Quick Track

Use Quick when all of these are true:

- behavior is local and readily observable;
- the project already has a suitable architectural pattern;
- no new lifecycle, persistent data, public contract, migration, or cross-system event ordering is introduced;
- one implementation pass and focused review can reasonably establish correctness;
- independent task handoffs are unnecessary.

Required flow:

```text
Compact PRD -> Implementation -> Review
```

The PRD may be a focused section in an existing feature document. Do not create Design, Implementation Plan, or Tasks solely to satisfy the workflow name.

## Standard Track

Use Standard when one or more of these apply, but architectural behavior is already understood:

- several files or modules must change in a deliberate order;
- implementation has meaningful setup, migration, or integration steps;
- more than one validation layer is needed;
- work may span sessions, but does not require independent worker task packets;
- the design follows an existing system boundary and does not introduce a new state model.

Required flow:

```text
PRD -> Implementation Plan -> Implementation -> Review
```

The Implementation Plan may contain checklist items, but do not create a separate Tasks artifact unless units must be independently assigned, resumed, or reviewed.

## Full Track

Use Full when any of these apply:

- a new gameplay or application subsystem is introduced;
- state transitions, timing, event ordering, restart, pause, cancellation, or resource ownership are significant;
- new persistent data, API/data contracts, migrations, or compatibility obligations appear;
- multiple modules or agents need a shared technical decision;
- failure would be expensive or difficult to reverse;
- implementation must be split into independently executable tasks;
- the work is expected to outlive one context window or require durable resumption state.

Required flow:

```text
PRD -> Design -> Implementation Plan -> Tasks -> Implementation -> Review
```

## Escalation Triggers

Escalate before continuing when implementation reveals:

- unresolved behavior that changes acceptance criteria;
- a new architectural boundary or dependency direction;
- hidden lifecycle, concurrency, timing, migration, or compatibility behavior;
- a write set too broad for one safe implementation pass;
- a need for independent worker delegation;
- validation that cannot be mapped to the current artifacts.

On escalation:

1. Pause the affected work.
2. Preserve completed, valid changes.
3. Create only the newly required artifact.
4. Reconcile downstream artifacts and tasks.
5. Re-run readiness before implementation resumes.

## User-Directed Exceptions

Honor an explicit request to skip an artifact, but state the lost guarantee and retain the smallest substitute needed for safe execution. Never interpret “skip design” as permission for the worker to invent architecture. If the missing decision is consequential and cannot be inferred, stop for user direction.
