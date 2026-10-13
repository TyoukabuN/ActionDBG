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

## Right-shoulder camera revision (2026-10-13)

Following player feedback that the first dynamic-camera pass still read as a distant stage, the stable overview, wind-up, decision and Counter-window poses were moved immediately behind the player's right shoulder. Action poses now use stronger height and focal-length differences while preserving screen direction. Counter also presents the enemy's Light/Heavy Attack card in the upper-right with name, damage, speed-line treatment and a short fade/slide/rotation entrance. Pause and reduced-motion behavior remain explicit. The checks and final visual evidence for this revision are appended after execution; earlier camera captures document the rejected composition rather than acceptance evidence for this revision.

The revision passed all 24 Combat/CameraDirector tests and a production build. Focused production-browser checks passed direct QTE/Counter and reduced-motion behavior; the first asserts the Light Attack card and 2 damage, and the heavy-flow scenario asserts Heavy Attack and 4 damage. A fresh real-input capture produced nine screenshots at 1280×800 and 1600×1000 in `/tmp/actiondbg-shoulder-camera-20261013/`: right-shoulder wind-up/decision, tilted Quick panel, entering/settled Counter card, parry panel, large decision/Counter, and reduced-motion overview. The capture manifest reports no page/console errors or horizontal overflow, and every Counter card remained inside the scene. Visual inspection confirms the player shoulder/cape frames the foreground, the opponent stays visible beyond it, the upper-right enemy card clears the HP HUD, and action panels use restrained opposing Dutch angles. These captures supersede the previous pass for camera-composition review. Human judgment of the desired manga feel still belongs to the next player review.

## Counter bars and impact VFX revision (2026-10-13)

Counter now interrupts any remaining card-impact hold, settles into a tighter right-shoulder shot, and drives two black planes from opposite horizontal sides into top and bottom letterbox positions. They leave the middle open. Rendering is explicitly composed as scene base → black bars → actors → effects; the character redraw places silhouettes in front of the bars and the final pass contains the contact ring, damage labels, 18 pooled blood points and 14 pooled Guard spark streaks. Reduced motion snaps the bar state and caps particle displacement. Pause freezes all feedback timers; restart clears both pools and the bars.

The production build and all 25 unit tests pass. Focused production-browser coverage passes the queue Guard and direct QTE/Counter paths using the system Chromium: it asserts 14 live spark streaks, 18 live blood particles, full Counter-bar convergence and the published render order. A real-input capture at `/tmp/actiondbg-vfx-20261013/` contains blood impact, Counter bars, parry and expanded Guard sparks at 1280×800; its manifest reports no browser/page errors or horizontal overflow. Visual inspection confirms the bars replace only the arena background layer while fighter silhouettes and effects remain visible above them. Active-play diagnostics in that capture peak at 261 draw calls, 28,250 triangles, 95 geometries and 3 textures, with 51 materials; there are four explicit composition passes, zero post-processing passes, one 1024² shadow-casting light and a DPR cap of 2. The draw-call peak is within the technical-art desktop starting budget of 300. These artifacts are local evidence and are not committed.

## Acceptance evidence

| Criterion | Result | Evidence and limits |
| --- | --- | --- |
| AC-01 direct input/action shots | PASS | QTE browser mouse and native focused-button Enter; number-key actions; changed shot id and actual camera coordinates; inspected captures |
| AC-02 sequence, time, AP, rejection | PASS | Combat tests plus browser saved timer/AP/repeat checks; action playback does not reset the budget |
| AC-03 counter, expiry, endings, retry | PASS | QTE counter/expiry/five restarts in browser; lethal QTE unit test; queue browser win/loss/immediate retry |
| AC-04 shot visibility/readability | PASS for prototype presentation | Nine actual captures, native motion sequence and browser error checks; final parry frame keeps floating damage below HP HUD; large-screen topline separation checked. Human cinematic quality remains untested |
| AC-05 lifecycle/comparison | PASS | Pause freezes camera/decision timer, reduced-motion stable overview, reset tests and all five original browser scenarios explicitly choose queue mode |

Local artifacts are `/tmp/actiondbg-cinematic-20261013-final/manifest.json`, associated screenshots, `motion-000.jpg` through `motion-082.jpg`, `motion-sheet.jpg`, and `large-layout-check.json` / `large-decision-checked.png`. They are temporary, uncommitted evidence. Earlier captures with the HUD overlap are not the accepted large-screen view. Screenshot baselines remain deferred because there is no human-approved composition baseline; behavioral tests plus real-input motion are used for this experiment. No hardware FPS guarantee is claimed; the later VFX revision records renderer counts for its multi-pass composition.
