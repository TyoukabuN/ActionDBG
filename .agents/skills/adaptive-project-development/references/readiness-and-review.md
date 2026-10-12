# Readiness And Review

Use these gates proportionally. Quick work needs a compact check; Full work requires explicit cross-artifact review.

## Requirements Ready

Confirm:

- the problem and desired outcome are explicit;
- in-scope and out-of-scope behavior do not conflict;
- requirements describe observable behavior rather than an assumed implementation;
- failure, retry, cancellation, and edge behavior are covered when relevant;
- acceptance criteria can be demonstrated or tested;
- open questions are either non-blocking or assigned for human decision.

## Design Ready

Confirm:

- each important requirement has a technical home;
- responsibilities and dependency direction are unambiguous;
- state transitions, event ordering, timing, lifecycle, and teardown are defined where relevant;
- failure and recovery paths do not rely on unspecified behavior;
- choices fit repository constraints and existing code;
- alternatives are compared for consequential decisions;
- performance, compatibility, security, persistence, and deployment impacts are addressed when applicable;
- the design is no more general than the current scope requires.

## Implementation Ready

Confirm:

- phases follow dependency order and can be validated independently;
- affected modules/files are plausible based on repository inspection;
- every acceptance criterion maps to at least one validation activity;
- setup, migration, cleanup, and documentation changes are included when required;
- no phase asks implementation to resolve an unstated architectural decision;
- failure or rollback behavior is defined for risky changes.

## Task Ready

Confirm:

- the task has one bounded outcome and a narrow write set;
- upstream references and dependencies are satisfied;
- required changes and prohibited changes are concrete;
- validation is runnable or its absence is explicitly justified;
- stop-and-return conditions prevent silent scope expansion;
- independent tasks do not contend for the same files or state.

## Implementation Review

The lead/reviewer checks:

1. Starting and ending `git status` and the actual diff.
2. Whether changed files stay within authorized scope.
3. Requirement, design, and task compliance.
4. Error paths, null/invalid inputs, state transitions, lifecycle, restart, and resource release where applicable.
5. API, serialization, data, save, and backward-compatibility risks.
6. Performance-sensitive loops, allocations, timing, and concurrency where applicable.
7. Tests for meaningful positive and negative behavior.
8. Whether documentation reflects actual behavior rather than intended behavior.

## Verification Evidence

Use these result values consistently:

- `PASS`: the check ran against the reviewed revision and met its expected outcome.
- `FAIL`: the check ran and did not meet its expected outcome.
- `NOT RUN`: the check was skipped, unavailable, or outside authorization; state why.

Distinguish:

- static/type checking;
- unit/integration tests;
- production build;
- automated browser/end-to-end checks;
- manual gameplay or UI checks;
- CI status;
- deployment status.

One category does not imply another. A successful build does not prove gameplay acceptance, and a screenshot does not prove state behavior.

## Acceptance Review

For every in-scope `AC-*`:

1. Identify the code or behavior that implements it.
2. Identify automated or manual evidence.
3. Mark `PASS`, `FAIL`, or `NOT RUN`.
4. Record limitations and environmental conditions.

Do not mark the feature verified while required acceptance criteria are `FAIL`. `NOT RUN` may remain only when the user accepts the limitation or the criterion explicitly permits deferred/manual verification.

## Completion

A task may be `implemented` before it is `verified`. A feature is complete only when:

- required artifacts match actual behavior;
- required tasks are verified;
- acceptance review is complete;
- failures, skipped checks, and known risks are reported;
- no required cleanup, documentation, or delivery work remains.
