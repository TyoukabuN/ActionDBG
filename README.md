# ActionDBG

A browser combat experiment: read a swordsman's intent, queue cards in slow motion, and decide whether to spend now or save action points for a counter.

## Run

Requires Node.js 22+ and npm. From the repository root:

```sh
npm ci
npm run dev
```

The Vite application uses `/ActionDBG/`. For a production build and local preview:

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

## Play

Start the encounter, observe the light/heavy attack, and select cards with the mouse or **1–4**. Select again to remove a queued card; selection order determines execution order. **Enter** submits, **Space** skips, and **R** restarts. Decision windows expire automatically. Leaving the page or changing tabs pauses both gameplay and decision time.

You have 10 HP; the swordsman has 12. Each round refreshes 3 AP. Light/heavy attacks alternate for 2/4 damage. Quick Strike costs 1 for 1 damage; Heavy Strike costs 2 for 3; Guard costs 1 and reduces the upcoming hit by 2; Counter costs 2 and cancels the enemy attack while dealing 2. Heavy Strike and Counter cannot be used in the round immediately following use. Remaining AP carries into that round's eligible counter window. No free movement, random draw, touch controls, sound, progression or external assets are included.

## Architecture

- `src/combat.ts`: pure deterministic combat state and two clocks; no browser/render dependency.
- `src/scene.ts`: Three.js primitive arena, fighters and animation.
- `src/main.ts`: input, HTML HUD, focus lifecycle and one fixed-step animation loop.
- `tests/combat.test.ts`: gameplay invariants and strategies.
- `tests/browser/`: real-input tests against the production preview.

See the [PRD](doc/prd/first-combat-prototype.md), [technical design](doc/features/first-combat-prototype/design.md), and [verification](doc/features/first-combat-prototype/verification.md). The prototype does not settle the final hand model or balance formulas. Human playtesting should evaluate action readability, time pressure, and whether counter windows interrupt too often.

## Browser checks

```sh
npx playwright install chromium
npm run build
npm run test:browser
```

If Chromium is already installed, set `CHROMIUM_PATH` to its executable. Temporary browser results and builds are ignored in Git. Software-rendered headless results do not establish performance on player hardware.

## GitHub delivery

Feature pushes and pull requests run CI validation. Main pushes build and deploy through GitHub Pages. In repository Settings → Pages, select **GitHub Actions** as the source. Merge a reviewed feature branch into `main` to trigger deployment. A pushed branch/local build is not proof of successful CI or deployment; inspect the actual workflow outcome before claiming the game is published.

The Vite base is `/ActionDBG/` for the repository site. Adjust it if moving to a custom domain or different repository. Runtime code does not use research API credentials.
