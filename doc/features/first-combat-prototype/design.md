# First Combat Prototype — Technical Design

Status: ready. Track: Full. Owner: lead. Updated: 2026-10-12.
Upstream: [PRD](../../prd/first-combat-prototype.md).

## Contract and acceptance map

The existing PRD is the product contract; the following IDs identify its acceptance groups without rewriting it: AC-01 complete ordinary play/damage/counter loop; AC-02 moving slow-motion and unscaled expiry; AC-03 shared AP, costs, queue uniqueness and cooldown; AC-04 guard/counter/lethal resolution and bounded triggers; AC-05 readable intent, preview/results and availability; AC-06 focus pause/resume; AC-07 terminal cancellation and five clean restarts; AC-08 short win/loss and two viable strategies. Human evaluation of fun/clarity remains playtest evidence, not an automated claim.

## Boundaries and API

`src/combat.ts` owns all rules, clocks and state, with no Three.js/DOM dependencies. `src/scene.ts` renders primitive swordsmen and a fixed arena camera from snapshots. `src/main.ts` owns DOM, keyboard intents, pause listeners and the sole animation loop. UI never mutates the snapshot. `src/style.css` owns responsive layout. No physics engine, movement system, audio or external assets are required.

Core exports:
- `CardId = 'quick' | 'heavy' | 'guard' | 'counter'`.
- `Phase = 'ready' | 'telegraph' | 'planning' | 'acting' | 'counter' | 'resolve' | 'victory' | 'defeat'`.
- `CARDS`: ordered readonly definitions with `id`, `name`, `cost`, `damage`, `description`, `cooldownRounds`.
- `Combat` methods: `start(): void`, `restart(): void`, `tick(realSeconds: number): void`, `toggleCard(id: CardId): boolean`, `submit(): void`, `skip(): void`, `setPaused(paused: boolean): void`, `availability(id: CardId): string | null`, `snapshot(): CombatSnapshot`.
- Snapshot fields: `phase`, `round`, `playerHp`, `enemyHp`, `ap`, `maxAp`, `remaining` (unscaled window seconds), `queue: CardId[]`, `committed: CardId[]`, `activeCard: CardId | null`, `guard`, `enemyAttack: 'light' | 'heavy'`, `enemyDamage`, `visualTime`, `phaseElapsed`, `paused`, `log: string[]` (bounded), `cooldowns: Record<CardId, number>` (rounds unavailable including next round at use time). Snapshots are detached copies.
- Scene exports `Arena` with constructor `(canvas: HTMLCanvasElement)`, `render(snapshot: CombatSnapshot): void`, `resize(): void`, `dispose(): void`.

## State and ordering

Initialize in ready. Start/restart begins telegraph with full HP (10/12), light intent, round 1 and 3 AP. Telegraph lasts 1.1 real seconds (light) or 1.6 (heavy); then planning lasts 4 seconds. Numbers select/toggle cards, allowing removal/reordering by selection. Planning reserves projected costs in the queue; submitting spends AP exactly once and commits the ordered list. Empty submit/skip passes. Each committed card has a 0.55-second action beat; effects resolve at its end, in order. Lethal player attack stops immediately and clears pending actions. Ordinary attacks do not cancel living enemy attacks.

After actions, open one 2-second counter window only if Counter has no cooldown and at least 2 AP remain. Counter selection is a one-card preview; submit or expiry with a queued Counter spends its cost, deals 2 damage and cancels enemy damage. Skip or empty expiry means taking enemy damage reduced by Guard, floored at zero. A 0.65-second resolution beat communicates results; then advance round, alternate light/heavy and restore AP. A card used in round N is unavailable in N+1 and returns in N+2. Counter never chains to another decision phase. Death cancels all pending actions and damage, and terminal inputs other than restart have no effect.

## Time and lifecycle

Decision windows use real elapsed time; visualTime advances at 0.15 during planning/counter and normally otherwise. Enemy animation remains visible during windows but animation pose is presentation rather than an independent damage clock. Phase transitions own all damage. The browser adapter bounds frame delta to 0.1 and advances fixed 1/60-second steps with bounded catch-up. Core tick can consume small steps without DOM timers. Explicit pause freezes both clocks. Blur/visibility pause clears keyboard state; focus resumes only if visible and resets timestamp/accumulator. Start and restart do not register listeners or create loops.

The root module removes its loop/listeners and disposes owned geometries/materials on HMR teardown. Canvas observes container size and caps pixel ratio at 2. WebGL initialization errors appear as text. Desktop keyboard/mouse only; HUD clicks do not target world interactions. No secret-bearing runtime code.

## Presentation and tradeoffs

Use a warm stone arena, teal player and rust-red enemy, simple humanoid geometry and swords, readable windups, action lunges, guard/counter feedback and fixed framing. Frame the duel diagonally from behind the player, Pokémon-style: near player back in the lower-left foreground, far opponent front in the upper-right, without fighter or HUD overlap. Keep the existing world-axis attack directions and apply camera shake relative to its new home position. No generated assets or polish pipeline. HUD provides HP, intent/damage, AP, round, phase, timer, ordered preview, committed results and specific rejection reasons. Start/retry are explicit; 1–4 selects, Enter submits, Space skips, R restarts. Block repeated keydown; do not capture shortcuts in editable fields.

Frozen time was rejected because the PRD explicitly tests slow motion. A general event engine and ECS were rejected for one deterministic encounter. No unresolved blocking technical choice remains. Timing/visual tuning is provisional and must be evaluated in human playtests.
