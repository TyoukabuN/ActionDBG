# ActionDBG: Project Purpose

## Vision

ActionDBG explores a game that combines deck-building decisions with the immediacy of visible 3D combat. The player should feel that choosing a card is choosing an attack, technique, spell, or response within an unfolding fight.

The project also establishes an AI-assisted prototyping workflow: describe a mechanic in natural language, implement a small playable version, test it in a browser, and refine it from player feedback. The goal is to discover an enjoyable game through short, complete iterations.

This is a game prototyping project. Prefer playable results, clear rules, simple architecture, and reliable builds. A production game engine, extensive content library, and polished final game are outside the initial scope.

## Intended player experience

The original [game vision](design/protoTypeImages.md) describes these directions:

- **Cards express combat actions.** Attacks, techniques, and spells become cards, connecting tactical choices to actions visible in the scene.
- **Slow motion creates a decision window.** During card-play phases, combat slows so the player can observe the opponent's action and choose a response under time pressure.
- **Character attributes shape decisions.** Reaction speed influences the decision-window duration; attack speed influences the available action resource budget. Exact formulas remain open.
- **Context opens new phases.** A counter-tagged card may become usable before an incoming hit; a bloodthirst-tagged card may become usable following damage. Cards may lead to additional actions or phases when designed to do so.
- **Progression emphasizes encounters.** Relatively fixed routes trigger events and battles, with possible branches and limited exploration. The emphasis is on combat decisions and their payoff.
- **Items have a separate role.** A backpack card pool separates items from combat cards.

These are design intentions, not claims of implemented mechanics. The design should test whether time pressure and readable opponent actions make card choices more engaging, without making the rules difficult to understand.

## Questions the prototypes should answer

1. Can the player understand an incoming action and make a meaningful card choice during slow motion?
2. Does the combination of tactical choice and visible action feel responsive and rewarding?
3. Do reaction speed and attack speed create useful differences in play rather than confusing timing or resource rules?
4. Do contextual counter and bloodthirst phases create interesting decisions without excessive interruption or uncontrolled phase chains?
5. Which hand model best serves this experience: fixed cards with cooldowns, retained cards, or draw/discard-based deck building?

Hand rules, discard/draw behavior, balance values, time scaling, and phase chaining are unresolved design choices. Record decisions after a scoped experiment; do not treat one of the alternatives as settled merely because it appears in an early prototype.

## Development purpose and workflow

The developer should be able to propose an idea and evaluate a playable result without maintaining a local development environment. Codex Cloud and the Codex desktop client support implementation and documentation work; GitHub stores the project and review history.

The intended delivery loop is:

1. Describe the desired mechanic and acceptance criteria.
2. Inspect existing design and code, then implement a focused playable increment.
3. Validate relevant gameplay rules, type checking, and the web build.
4. Review changes through a feature branch and pull request.
5. After merge to `main`, use GitHub Actions to validate, build, and deploy to GitHub Pages.
6. Play the browser build, identify what works and what is confusing, and iterate.

Three.js provides 3D rendering, TypeScript with strict checking provides application code, Vite provides development/build tooling, and HTML/CSS provides simple UI. Keep gameplay rules independently testable and start with primitive geometry and procedural visuals. Runtime assets should remain self-contained and work under the GitHub Pages repository base path.

This describes the target workflow. It does not establish that CI, deployment, or a playable build already exists.

## Initial milestones

### 1. Verify the development and delivery pipeline

Create a minimal 3D scene with ground and lighting, a primitive player, WASD movement, a third-person follow camera, basic mouse interaction, a simple HUD, and responsive canvas resizing. Verify the development loop, validation, and browser deployment.

This is a technical validation milestone. Movement and camera behavior are not a commitment to the final combat controls or level structure.

### 2. Test one representative combat encounter

Build a small encounter that demonstrates card-driven actions, a readable opponent action, a bounded decision window, visible outcomes, and fast retry. Limit content to what is needed to evaluate the core experience. Define the clock and phase rules explicitly and test them separately from rendering.

The exact encounter, card set, and hand model must be designed before implementation; they are not specified by this purpose document.

### 3. Expand only after playtesting

Use feedback from the representative encounter to decide which card rules, contextual phases, attributes, and route events deserve expansion. Prefer improvements to clarity and decision quality over increasing content volume.

## Scope boundaries

- No Unity or Unreal Engine; the initial target is a browser game.
- No backend server, multiplayer networking, or external runtime-service dependency.
- No complex ECS, editor, or custom engine unless later explicitly requested.
- No external hosting platform; GitHub Pages is the intended web host.
- No initial NW.js Windows packaging or per-PR preview infrastructure. Those may become separate future tasks.
- External generated assets and premium visual polish are optional, not prerequisites for proving the core loop.

## Success criteria

The project succeeds initially when a focused browser prototype is easy to access, its controls and decisions are understandable, the player can complete or fail an encounter and retry, and feedback can guide the next iteration. Builds and important gameplay rules should be verifiable so each completed change leaves a usable prototype.

More cards, higher visual fidelity, or a larger architecture are not sufficient evidence of progress unless they improve the experience being tested.

## Status at this document's creation

As of 2026-10-12, the repository contains the original design notes, project agent instructions, and development/research skills. Game source, dependency manifests, automated game tests, CI/CD workflows, and a playable deployment have not yet been created. This is a historical snapshot; inspect the repository for current status.

Use [AGENTS.md](../AGENTS.md) for development conventions and skill routing. Use this document for the project's purpose, scope, and initial direction; it should not become an execution log. Keep detailed gameplay proposals in `doc/design/` and concrete requirements and acceptance criteria in `doc/prd/` as they are developed.
