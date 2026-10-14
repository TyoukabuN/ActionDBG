# ActionDBG Agent Guidelines

## Purpose and scope

ActionDBG is an AI-driven browser game prototyping project. Turn natural-language game ideas into small, playable prototypes that can be tested without a local development environment. Prioritize fast iteration, readable code, simple architecture, and reliable automated builds.

Use Codex Cloud for development, GitHub for source control and pull requests, GitHub Actions for validation and deployment, and GitHub Pages for playable web builds.

Follow the current task scope. These guidelines describe the intended workflow; verify the repository before treating any capability as implemented. Keep this file focused on actionable project rules; put research and validation history in task documents.

## Communication

- Communicate with the user primarily in Chinese.
- Write code and identifiers in English. Write project documentation under `doc/` in Chinese, including technical designs, plans, tasks, verification records, and research. Preserve code identifiers, commands, paths, URLs, and requirement IDs verbatim.
- Explain important design choices briefly and state reasonable assumptions.
- Ask only when a consequential product or architecture choice cannot reasonably be inferred. Continue independent work while awaiting an answer.
- Report verified outcomes and distinguish failures, skipped checks, and checks not run.

## Start each task

1. Read applicable `AGENTS.md` files and inspect `git status` before editing. Preserve user-owned changes.
2. Read `doc/design/protoTypeImages.md` for the game vision and task-relevant documents under `doc/prd/`.
3. Read existing architecture, constraints, plans, progress, and decisions when present, then inspect relevant source, manifests, lockfiles, scripts, and workflows.
4. Load applicable skills from `.agents/skills/` by reading their `SKILL.md` and the references needed for the task.
5. State the intended scope and validation briefly, then execute the authorized work.

Use the existing checkout in Codex Cloud. Each cloud task is already isolated; do not create a Git worktree unless the user requests one. For changes, use a feature branch and prepare a pull request when the task calls for delivery through GitHub. Do not commit or push changes directly to protected `main`, force-push, or discard user work.

## Game design source

`doc/design/protoTypeImages.md` is the primary source for the game's intended feel and mechanics:

- Deck-building combat expresses attacks, techniques, and spells as cards.
- Card-play phases slow the game world so opponents' actions remain visible.
- Reaction speed influences the card-play time window; attack speed influences the action resource budget.
- Items use a separate backpack card pool.
- Progression favors relatively fixed routes, automatic events, and encounters, with possible branches and limited exploration.
- Card tags can open contextual phases, such as a counter phase before an incoming hit or a bloodthirst phase following damage.

Treat these as design intent, not evidence of implemented behavior. Hand retention, cooldowns, draw/discard rules, numerical formulas, and phase chaining remain open choices until documented. Do not silently turn alternatives in the design notes into permanent requirements.

The first pipeline-validation prototype is a separate, limited milestone: ground and lighting, a primitive player, WASD movement, a third-person follow camera, basic mouse interaction, a simple HUD, and responsive canvas resizing. It verifies development and deployment before adding card combat. Do not expand a bootstrap task into the full game.

For combat implementation, keep simulation time and decision-window time explicit. Define how slow motion, pause, focus loss, and restart affect timers. Make event ordering, phase eligibility, and resource consumption testable without rendering. Use explicit combat states and transitions; bound triggered phase chains, prevent duplicate event resolution, and define whether lethal damage cancels pending phases.

## Playable increments

- For each gameplay slice, state the player action, objective, pressure or tradeoff, feedback, and completion/failure/retry behavior. Keep this brief in the task's existing design or PRD; the pipeline demo only needs its stated interaction checks.
- Implement one representative encounter before adding more cards, enemies, routes, or asset variants. Prove the loop through player input rather than a static scene or scripted showcase.
- Expose tunable costs, durations, speeds, and damage as typed data or configuration. Avoid scattering balance constants through rendering code; do not build a generic content framework before it is needed.
- Show the information needed for decisions: phase, remaining decision time, usable cards and costs, resources, damage, and why an action is unavailable. Distinguish action previews from committed outcomes.
- Make the next iteration easy to evaluate: document controls and the mechanic being tested, provide a fast reset/retry, and keep success and failure understandable.

## Skill routing

Project-local skills live in `.agents/skills/`. Read the actual instructions rather than inferring behavior from a skill name.

| Task | Guidance |
| --- | --- |
| End-to-end feature or gameplay-system development with complexity-scaled documents and review gates | `adaptive-project-development` |
| Design-only architecture work without implementation orchestration | `system-design-governance` |
| Long-running implementation, migration, or documentation maintenance | `refactor-doc-governance` |
| Code implementation, fixes, or optimization using the lead/worker workflow | `sol-luna-dev`, following its worker contract and supported runner capabilities |
| Source-backed explanation of a technical flow | `technical-flow-teacher` |
| Explicit DeepSeek provider setup or switching | `deepseek-codex-native` |
| Reddit/GitHub research and evidence-based project reviews | `community-research` |

Use [majidmanzarpour/threejs-game-skills](https://github.com/majidmanzarpour/threejs-game-skills) as the Three.js game development guidance. For broad game work, start with `threejs-game-director`; it routes to gameplay, graphics, UI, debugging, and QA specialists as needed. For narrow tasks, load only the relevant guidance.

The complete nine-skill package is installed under `.agents/skills/threejs-*/`. Read `.agents/skills/threejs-game-director/SKILL.md` and the relevant sibling skills locally, including their required references. See `.agents/skills/threejs-game-skills-source.md` for the pinned upstream revision and license record. Preserve existing skills when updating the package.

Project constraints govern how generic skill recommendations are applied. Keep initial assets primitive or procedural, validation proportional, and hosting on GitHub Pages. External asset APIs and paid generation are optional and require an explicit task need and authorized access. Do not change model providers merely to develop the game. Delegate only when authorized by the user or applicable instructions and supported by the runner; never claim a worker model was used without evidence.

## Technology and architecture

- Use Three.js for 3D rendering, TypeScript with strict checking, Vite for development and production builds, and HTML/CSS for simple UI.
- Prefer npm and a committed lockfile unless the repository establishes another package manager. Use `npm ci` for repeatable CI installation when a lockfile exists.
- Keep gameplay state and rules independent of Three.js, DOM APIs, and browser input. Rendering and input adapt the simulation to the browser.
- Use explicit, modular systems and a simple lifecycle: initialize, start, update, stop, restart.
- Use delta-time-based updates with documented time units and bounded frame deltas. Make randomized gameplay seedable when it needs deterministic testing.
- Use a fixed simulation step with bounded catch-up when collision, physics, or timing-sensitive combat needs it; a simple delta-time loop is sufficient for the initial movement demo. Read frame time once and pass it through systems in a documented order. Advance gameplay timers from the simulation, not independent browser intervals.
- Pause single-player gameplay on hidden tabs by default, clear held inputs on blur, and reset the frame-time baseline on resume. Define exceptions explicitly; returning to a tab must not consume a combat decision window unexpectedly.
- Release owned geometries, materials, textures, render targets, event listeners, timers, and audio resources on teardown. Shared assets must remain alive until their last owner releases them. Restart must reset gameplay state and avoid duplicate update loops or listeners.
- Use primitive geometry and procedural visuals first. Add dependencies only when they solve an actual gameplay requirement.
- Do not introduce Unity, Unreal Engine, a backend server, multiplayer networking, a complex ECS, an editor, or a custom engine.
- Leave NW.js Windows packaging for a future task. Keep the browser entry point suitable for later packaging without adding desktop infrastructure now.

## Browser input, UI, and performance

- Start with desktop keyboard/mouse support. Responsive layout does not imply touch controls or mobile gameplay support; add and verify those only when required by scope.
- Translate input into gameplay intents. Prevent HUD/card clicks from also triggering world actions; suppress browser defaults only for active game controls and preserve normal interaction with text fields.
- Keep controls discoverable and HUD text readable. Do not encode card eligibility or damage using color alone. Provide keyboard-operable HTML buttons for menus and card actions where practical.
- If pointer lock is used, request it from a user gesture, handle Escape/unlock, and provide a clear resume action. Unlock audio from a user gesture and support mute when audio is added.
- Resize the drawing buffer and camera to the canvas container; cap pixel ratio deliberately. Handle loading failures and unavailable WebGL with a visible message rather than a blank screen.
- Before adding costly visuals, choose a reference viewport/device and frame-time target. Measure representative active play, draw calls, geometry, textures, and large assets when graphics change; record the measured conditions rather than claiming universal FPS guarantees.
- Avoid unnecessary allocations and DOM layout work in hot loops. Profile before introducing pooling, instancing, physics libraries, or post-processing infrastructure.

## Assets and deployment paths

- Store runtime assets under `public/assets/`; support GLB/glTF, textures, audio, and JSON as needed.
- Resolve asset URLs with Vite's configured base path, including `import.meta.env.BASE_URL` for public assets. Avoid origin-root paths that break repository-hosted GitHub Pages.
- Configure the actual Pages base path from the deployment target; for the standard repository site it is `/ActionDBG/`.
- Keep runtime gameplay self-contained. Do not depend on external runtime services or remote asset hotlinks.
- Never put credentials in source, documentation, client bundles, or committed environment files. Read required credentials through supported secure configuration without printing their values.
- Record the source, license, and required attribution for third-party assets before including them. Keep generated assets traceable when generation is in scope.
- Do not commit generated builds, dependency directories, or temporary test outputs.

## Documentation and implementation

Keep changes focused, read code before changing it, preserve working mechanics, and avoid unrelated refactoring. Maintain documents according to responsibility:

- `doc/prd/`: goals, scope, non-goals, player behavior, and acceptance criteria.
- `doc/design/`: gameplay design and detailed technical proposals.
- Architecture and constraints documents: stable boundaries, lifecycle, dependencies, invariants, and lasting restrictions.
- Implementation plans: phases, ordering, affected modules, and validation.
- Progress documents: current state, next action, blockers, and unverified risks.
- Decision records: durable choices and rationale.

Use existing document locations and naming conventions. Add only documents justified by the task; do not generate a full governance suite for a small edit. Keep execution logs out of the PRD. Current code establishes implemented behavior, progress establishes current status, and decision records explain durable choices; identify conflicts with requirements before proceeding.

## Validation and delivery

Establish consistent npm scripts when bootstrapping: `dev`, `typecheck`, `test`, `build`, and `preview`. Until they exist, do not report these commands as available or passing.

For gameplay changes, run strict type checking, relevant automated tests, and a production build. Test meaningful rules such as movement timing, card costs, decision-window expiry, phase transitions, damage/event ordering, and restart behavior as they are introduced. Include rejected actions, lethal damage, duplicate triggers, and bounded phase chains for combat. Use seeded RNG and injected time for repeatable rule tests; a fixed timestep alone does not make the full game deterministic.

When browser execution is available, smoke-test the affected playable flow with real input, check console/page errors, verify a nonblank scene and readable HUD, and inspect responsive resizing. For the bootstrap milestone, verify player movement, camera follow, mouse interaction, and restart if provided. For combat, exercise card selection, resolution, expiry, failure, and retry; also check hidden-tab resume and input cleanup. Check the production preview under the configured Pages base path, including asset loading. If browser validation is unavailable, state that limitation.

Use Playwright or an equivalent existing browser harness when browser automation is needed. Prefer state/behavior assertions; screenshots and nonblank pixels support visual inspection but do not prove gameplay correctness. Keep debug controls and test hooks gated from normal production use. Reuse valid evidence for the same revision and repeat only checks affected by new changes or unresolved failures.

Documentation-only changes require content and link review, not unrelated game builds. For every task, review the final diff and leave the project runnable when runtime code was changed. Do not treat a zero-test run as gameplay validation.

GitHub Actions should install locked dependencies, type-check, run available tests, and build on pull requests. After merge to `main`, validation and a successful build precede GitHub Pages deployment. Use minimal permissions; grant Pages deployment permissions only to the deployment job and do not expose secrets to untrusted pull requests. PR preview deployments and NW.js packaging are deferred. Do not introduce Vercel, Netlify, or other hosting providers.

At completion, report what changed, relevant files, checks actually run, implemented mechanics, and known limitations. Include a PR URL or playable deployment URL only when it exists and is verified. Distinguish local build success, CI success, and successful deployment. Identify manual GitHub settings, such as selecting GitHub Actions as the Pages source, only when relevant to the work completed.
