# First Combat Prototype — Tasks

Sources: [design](design.md), [plan](implementation-plan.md), [PRD](../../prd/first-combat-prototype.md).

| Task | Outcome / write set | Dependencies | Validation | Status |
| --- | --- | --- | --- | --- |
| T1 | Pure combat engine and rules tests: `src/combat.ts`, `tests/combat.test.ts` | Core API/design ready; lead creates tooling | 12 Vitest checks and typecheck; AC-01–04,06–08 | verified |
| T2 | Browser adapters: `src/main.ts`, `src/scene.ts`, `src/style.css`, `index.html` | Frozen T1 contract; does not edit T1 files | Production build, four real-input browser scenarios, inspected active screenshot; AC-01–02,05–07 | verified |
| T3 | Tooling, CI, README, browser checks and final evidence | T1/T2 review | npm ci, typecheck, rules tests, production preview, AC mapping; hosted CI/deployment not yet verified | implemented |

Workers must read PRD/design, keep to their write sets, preserve other changes, and stop/report if the contract cannot satisfy the PRD. No commit, push, deployment or dependency edits by workers. Lead reviews actual files and checks; task status becomes verified only after review. Human fun/readability feedback is separately marked NOT RUN until supplied.
