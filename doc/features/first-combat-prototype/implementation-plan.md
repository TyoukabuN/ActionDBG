# First Combat Prototype — Implementation Plan

Status: ready. Track: Full. Updated: 2026-10-12.
Sources: [PRD](../../prd/first-combat-prototype.md), [design](design.md).

1. **Rules and bootstrap (AC-01–04, AC-06–08):** establish pinned npm/Vite/TypeScript tools; implement `src/combat.ts` and focused rule tests. Validate costs, cooldown boundary, unscaled deadlines, pause, death, bounded counters, deterministic restart and both strategies.
2. **Browser presentation (AC-01–02, AC-05–07):** implement Three.js arena and HTML card HUD against the frozen core contract. Add real-input desktop browser smoke tests, sizing and lifecycle coverage. Validate type checking, no console/page errors, canvas visibility, correct state/result feedback and repeated retry.
3. **Delivery (all AC):** build with `/ActionDBG/` base; serve production output and verify real input. Add CI checks and main-only Pages deployment. Document controls and manual Pages setup, record acceptance evidence and remaining human playtest questions. Commit/push the feature branch, then run a delivery build as requested.

Dependencies: Node 22+ available; npm registry access; browser binaries if not already present. Installation changes only new manifests/lockfile. Risks: headless software WebGL support, timing-driven browser tests and provider network limits. Do not weaken gameplay assertions or TLS checks to resolve these.
