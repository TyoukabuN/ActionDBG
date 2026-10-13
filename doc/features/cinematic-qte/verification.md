# Cinematic QTE — Verification

2026-10-13; Full track. Upstream: [PRD](prd.md), [Design](design.md), [Plan](implementation-plan.md), [Tasks](tasks.md). Reviewed in the existing `main` checkout under the user's continuing direct-main delivery instruction.

## Implementation and lead review

Loaded adaptive project development routing/contracts/review/ActionDBG profile and role handoffs; sol-luna-dev and its worker contract; Three.js director, gameplay systems/game-feel, UI designer/UI patterns, QA/visual-test-harness and evidence-manifest guidance. Two bounded implementation workers used the supported `gpt-6-luna` fallback because the skill's old binding is unavailable. Lead owns the UI adapter, browser scenarios, integration, review and delivery. A repair worker was interrupted by its usage limit; the lead completed and tested the repairs directly.

Inspected actual Combat, camera, scene and input diffs. QTE resumes its saved decision budget, uses existing costs/cooldowns, rejects acting/repeated/paused input, and cancels pending work on lethal damage. Queue rules remain available for comparison. Focused native button activation is preserved; the hidden start button is blurred after activation. A new card interrupts a previous impact-camera hold. Successful Counter retains parry framing through resolve and suppresses a cancelled enemy swing; resetting unused Guard after Counter is not displayed as a block. Restart/mode changes clear presentation state. No dependencies, model assets, CI changes or new draw loops were added.

## Checks

- PASS: `npm test`: 24 tests (17 Combat, 7 CameraDirector), including original queue behavior plus direct play, AP, resumed budget, duplicate rejection, counter, expiry, lethal cancellation, pause, reset, shot differences and reduced motion.
- PASS: `npm run build`: strict TypeScript and Vite `/ActionDBG/` production output. JavaScript 562.02 kB minified / 145.91 kB gzip; existing 500 kB advisory remains.
- PASS: focused production browser run: 3 QTE scenarios, real mouse/keyboard inputs and Playwright clock, 1.9 minutes.
- PASS: full production browser regression: all 8 scenarios, 4.2 minutes. After a final presentation-only change widened parry framing and lowered damage labels, the affected direct-play/counter browser scenario was rerun and passed (23.8 seconds); all 24 unit tests and production build were also rerun successfully.
- PASS: real-input capture run `cinematic-qte-20261013-final`: 9 screenshots across 1280×800 and 1600×1000, plus an unpaused native CDP screencast of 83 frames. Browser/page errors: none; horizontal overflow: none. Inspected establishing/wind-up, decision, quick/heavy, guard, counter and parry views plus motion contact/recovery. No gameplay-state forcing or upstream scorecard was used. A final CSS-only large-screen adjustment separates HUD from the shot/round topline; the affected 1600×1000 layout and production build were rechecked separately.

The initial browser attempt was interrupted after discovering that a typecheck failure left the previous production build in place. The nullable mount reference was corrected, production rebuilt, and the focused run passed. No stale run is counted as evidence. Browser clock cases exercise RAF-driven simulation and public input; no production state-control hooks were added.

Human cinematic pacing/feel and hosted GitHub Actions/Pages deployment are not established by local checks. This is a procedural animation prototype with limited-time technique choices, without perfect-timing grades, random button sequences or final character art.

## Acceptance evidence

| Criterion | Result | Evidence and limits |
| --- | --- | --- |
| AC-01 direct input/action shots | PASS | QTE browser mouse and native focused-button Enter; number-key actions; changed shot id and actual camera coordinates; inspected captures |
| AC-02 sequence, time, AP, rejection | PASS | Combat tests plus browser saved timer/AP/repeat checks; action playback does not reset the budget |
| AC-03 counter, expiry, endings, retry | PASS | QTE counter/expiry/five restarts in browser; lethal QTE unit test; queue browser win/loss/immediate retry |
| AC-04 shot visibility/readability | PASS for prototype presentation | Nine actual captures, native motion sequence and browser error checks; final parry frame keeps floating damage below HP HUD; large-screen topline separation checked. Human cinematic quality remains untested |
| AC-05 lifecycle/comparison | PASS | Pause freezes camera/decision timer, reduced-motion stable overview, reset tests and all five original browser scenarios explicitly choose queue mode |

Local artifacts are `/tmp/actiondbg-cinematic-20261013-final/manifest.json`, associated screenshots, `motion-000.jpg` through `motion-082.jpg`, `motion-sheet.jpg`, and `large-layout-check.json` / `large-decision-checked.png`. They are temporary, uncommitted evidence. Earlier captures with the HUD overlap are not the accepted large-screen view. Screenshot baselines remain deferred because there is no human-approved composition baseline; behavioral tests plus real-input motion are used for this experiment. No hardware FPS guarantee or renderer-budget measurement is claimed; the feature adds camera math, not new scene geometry or render passes.
