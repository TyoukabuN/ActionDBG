# Cinematic QTE — Tasks

All tasks consume [PRD](prd.md), [Design](design.md) and [Plan](implementation-plan.md).

- T-01 — verified (17 Combat tests passed, lead diff reviewed): Combat direct-play mode/resumed decision budget (AC-01–03). Write set: src/combat.ts, tests/combat.test.ts. No UI/render edits. Validate existing and new rule tests; stop if the declared API cannot meet bounded transitions.
- T-02 — verified (7 camera tests passed, lead repairs reviewed): authored camera director and Arena integration (AC-04–05). Write set: src/camera.ts, src/scene.ts, tests/camera.test.ts. No Combat/UI edits. Validate shot selection, pause/reset/reduced-motion and types; stop if pose logic needs gameplay mutation.
- T-03 — verified (8 browser scenarios passed, affected counter rerun passed): lead integrates src/main.ts, src/style.css and tests/browser/duel.spec.ts (AC-01–05), plus docs. Validate direct screen/keyboard play, queue compatibility, timing, focus and retry.
- T-04 — verified (lead diff, production build, browser regression and motion/layout evidence reviewed): lead diff review, final test/build/browser/motion evidence and delivery. No external assets, dependencies or CI changes. Mark verified only after actual checks.
