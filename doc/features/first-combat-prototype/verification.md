# First Combat Prototype — Verification

Updated: 2026-10-12. Track: Full. Branch: `feat/first-combat-prototype`.
Status: implemented; automated gameplay acceptance passed; human playtest feedback pending.
Upstream: [PRD](../../prd/first-combat-prototype.md), [design and AC mapping](design.md), [tasks](tasks.md).

## Executed checks

| Check | Result | Evidence |
| --- | --- | --- |
| Reproducible installation | PASS | `npm ci --cache /workspace/.npm-cache --no-audit --no-fund` |
| Strict TypeScript | PASS | `npm run typecheck`; build also type-checks |
| Gameplay rules | PASS | `npm test`: 12 tests executed |
| Production build | PASS | `npm run build`: Vite `/ActionDBG/` output |
| Browser integration | PASS | `CHROMIUM_PATH=/usr/bin/chromium npm run test:browser`: 4 scenarios passed against production preview |
| Dev entry readiness | PASS | Started `npm run dev -- --port 5173 --strictPort`; local HTML and transformed main-module requests succeeded |
| GitHub Actions execution | NOT RUN | Workflows authored; local results do not establish hosted CI status |
| GitHub Pages deployment | NOT RUN | Requires reviewed main merge and Pages source set to GitHub Actions |
| Human experience evaluation | NOT RUN | Player feedback on clarity, pressure and interruptions is still required |

Browser environment: installed Chromium on Linux, software WebGL allowed, 1280×800 desktop viewport. After the full four-test pass, a small change preserved native terminal-button keyboard activation; the affected keyboard and pause/motion tests were rerun and both passed. Real clicks and keyboard input drive cards, submission and retry; no production gameplay-control hook was added. Blur and hidden-page event wiring is exercised with dispatched events and temporary document visibility overrides; this is not a manual OS/tab switching session. Canvas-only captures differ during planning, proving continued visible motion, and the active scene screenshot was inspected for fighters, intent, HUD and framing. Evidence files under `test-results/` are temporary and ignored by Git.

## Acceptance coverage

| Acceptance | Result | Evidence / limitation |
| --- | --- | --- |
| AC-01 ordinary play, damage and counter loop | PASS | Rules and keyboard/mouse browser paths execute the phases and check HP/AP |
| AC-02 visible slow motion and unscaled expiry | PASS | Visual time advances at 0.15 in rule test; decision countdown advances normally; changed canvas-only captures; browser expiry submits queue |
| AC-03 resources, unique queue and cooldown | PASS | Ordered cost reservation, removal, duplicate submission prevention, N+1 unavailable/N+2 ready, shared counter AP |
| AC-04 guard/counter/lethal and chain bounds | PASS | Full light block, partial heavy block, counter cancellation, terminal state freeze and one counter window per round |
| AC-05 readable feedback | PASS for implemented information | Inspected active scene/HUD, light/heavy text, full card reasons, preview vs in-motion/pending/resolved actions, result log. Comprehension by a new human player remains untested |
| AC-06 focus lifecycle | PASS for automated adapters | Pause freezes both clocks, blocks input, clears held keys and resumes with reset frame baseline; real OS/tab behavior should also be checked in user playtest |
| AC-07 terminal cancellation and five restarts | PASS | Victory/defeat stop future mutation; browser repeats reset five times with initial HP/AP/round; one RAF/listener registration is maintained |
| AC-08 short game and two strategies | PASS for mechanics; feedback NOT RUN | Rule tests prove attack-first and counter-saving wins; browser plays an attack-first win, idle loss and immediate retries. Fun, time-pressure perception and disruption require human feedback |

## Lead review and repairs

Workers implemented disjoint rule/test and browser files using the supported `gpt-6-luna` model (the skill's older model binding was unavailable). Lead inspected actual sources and test output, then repaired:

- hidden error/pause layers overriding the HTML hidden attribute;
- a foreground arena wall/columns obscuring the fighters;
- Counter preview expiry incorrectly skipping rather than submitting;
- cooldown explanation priority and pending-vs-resolved labels;
- stale counter animation history affecting later rounds;
- Guard's distinct shield pose and character facing/swing presentation;
- paused controls, input-listener teardown, focus resumption and excessive unchanged HUD rebuilds;
- missing favicon causing a real 404 console error.

Repeated only checks needed after these relevant fixes. Screenshots supported visual review; they were not used as a substitute for gameplay assertions. Screenshot baselines were deferred because this primitive prototype has time-varying animation and no approved visual baseline. Behavioral browser tests and active captures cover the initial target.

## Limits and next feedback

The JavaScript bundle is approximately 510 kB minified / 131 kB gzip, primarily Three.js, and Vite reports its 500 kB advisory warning. No arbitrary warning threshold was raised. Headless results do not imply a universal frame rate or tested hardware performance. Runtime uses self-authored primitive geometry and an SVG icon; no external asset licensing or generation jobs are involved.

Ask the player: Can you read light/heavy intent? Does the four-second window create useful pressure? Is saving two AP for Counter understandable? Does the counter phase interrupt too often? These answers should drive balance/hand-model changes rather than treating this experiment's defaults as permanent design.

## Rear battle-camera update

On 2026-10-12, changed fixed framing to a Pokémon-style diagonal view from behind the player. The near player's back occupies the lower-left foreground; the far opponent's front remains visible above and to the right. Fighter positions, facings and world-axis attack animations are unchanged. Impact shake is added relative to the new camera home instead of resetting its X position.

Typecheck and production build passed. A focused Playwright browser check against the built preview used real start/card/submit/restart input, captured planning at 1280×800 and 1600×1000 plus Heavy Strike in motion, and reported no console/page errors or horizontal overflow. The three captures were visually inspected for actor facing, occlusion, framing and HUD placement. Gameplay-rule tests were not repeated because the change touches only rendering and requirement/design documentation. Local screenshot evidence is stored under `/tmp/actiondbg-rear-*.png` and is not committed. Hosted deployment of this update is not yet verified.
