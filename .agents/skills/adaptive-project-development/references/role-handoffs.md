# Role Handoffs

Roles define ownership. Use separate agents only when delegation is authorized, available, and useful.

## Product To Architect

Input:

- approved or reviewable PRD;
- project constraints and existing behavior;
- explicit open questions.

Handoff is ready when the Architect can distinguish requirements from alternatives and knows which decisions require human approval.

The Architect must not silently convert an open product choice into a durable requirement.

## Architect To Planner

Input:

- Requirements Ready PRD;
- Design Ready technical design when the Full track applies;
- current repository facts and constraints.

Handoff is ready when the Planner can sequence implementation without inventing system behavior.

Architect and Planner may be the same lead agent. Do not spawn a separate Planner simply to satisfy a role label.

## Planner To Worker

Input for each bounded task:

```text
Goal:
Context and upstream references:
Files / modules involved:
Required changes:
Constraints:
Do not change:
Validation steps:
Stopping conditions:
Expected output:
```

The worker must:

- inspect the assigned files and applicable instructions;
- preserve user-owned and other-worker changes;
- make the smallest change that satisfies the task;
- run the requested checks when available;
- stop if the design is invalid, dependencies are missing, or scope must expand;
- report changed files, validation results, deviations, and known issues.

The worker must not:

- redefine requirements or architecture;
- broaden the write set without returning to the lead;
- commit, push, publish, or mutate external systems unless explicitly authorized;
- claim checks that did not run.

## Luna Integration

When the repository provides `sol-luna-dev`, use its current Worker Task contract and lead review loop rather than copying a stale Luna prompt into project artifacts.

- The lead completes analysis and readiness first.
- Send Luna one Task Ready unit or a tightly coupled small batch.
- Keep write sets narrow; avoid parallel write-heavy workers unless ownership is disjoint.
- Luna reports implementation and evidence; the lead remains accountable for correctness.
- Limit automatic worker/repair loops according to the active worker skill; do not retry indefinitely.
- If model binding cannot be verified, report the worker path honestly without claiming Luna ran.

## Worker To Reviewer

The Reviewer receives:

- task ID and upstream references;
- starting repository state when relevant;
- actual diff and changed-file list;
- commands run and raw outcome summaries;
- deviations and unresolved issues.

The Reviewer independently checks scope, behavior, lifecycle, compatibility, tests, and acceptance coverage. Review must inspect actual files and diffs; a worker summary is navigation, not evidence.

## Reviewer Repairs

Return targeted findings with path and line when possible:

```text
Finding ID:
Requirement/task reference:
Problem:
Impact:
Required correction:
Validation to rerun:
```

Do not ask the worker to redesign the entire feature. If a finding invalidates Design or Plan, return control to the lead and update the owning artifact before issuing a new task.
