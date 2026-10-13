# Cinematic QTE — Implementation Plan

Upstream: [design](design.md). Full track, ready, 2026-10-13.

1. Implement QTE mode and direct-play/resumed-budget rules in Combat; preserve queue tests and add rejected/terminal/chain tests (AC-01–03). In parallel, implement presentation camera poses/transitions and isolated lifecycle tests in scene/camera files (AC-04–05). Contracts are fixed in Design; no shared file ownership.
2. Integrate browser buttons, keyboard, mode selection and contextual labels against the snapshot contract. Update legacy browser tests to explicitly choose queue mode; add QTE real-input scenarios (AC-01–05).
3. Lead review: inspect actual diffs, run strict types, rules/camera tests, production build and browser regression. Capture multiple action shots and an unpaused sequence at desktop viewports; inspect threat visibility and errors. Repair focused defects, record limits, then commit/push main under the user's existing direct-main authorization. Local build does not establish hosted deployment.
