# Agent Guidelines Review

## Scope and evidence

Reviewed the root `AGENTS.md` against the ActionDBG design, the project bootstrap brief, local governance skills, and publicly accessible GitHub sources. This is a documentation review; no game implementation, runtime validation, skill installation, or deployment was performed.

GitHub raw sources were read on 2026-10-12. These links track upstream branches and may change. The recommendations below are project-specific conclusions, not claims of community consensus.

Reddit research was attempted through `www.reddit.com` for r/threejs game/performance and r/gamedev prototype/scope searches, and through `old.reddit.com` and `reddit.com`. Initially, the environment proxy rejected the connection with `403 Forbidden`. After the user published the domain allowlist changes, the environment recovered and requests reached an HTTP response containing Reddit's own "whoa there, pardner!" block page. It states that the request was blocked due to a network policy and suggests login or developer credentials. JSON and HTML search requests still did not provide discussion content. No Reddit posts or comments were read or cited. Reddit evidence remains outstanding; user-provided discussion content or a supported authenticated access route is needed. Further environment allowlist additions are not indicated by this response.

## Sources and implications

| Source | Observed guidance | Application to ActionDBG |
| --- | --- | --- |
| [AGENTS.md format repository](https://github.com/agentsmd/agents.md/blob/main/README.md) | Dedicated project instructions with concrete development and testing guidance | Keep root instructions actionable and move review history to this file |
| [Three.js game director](https://github.com/majidmanzarpour/threejs-game-skills/blob/main/skills/threejs-game-director/SKILL.md) | Playable loop first; user scope controls quality and verification depth | Separate pipeline validation from a combat slice; avoid mandatory premium graphics work |
| [Three.js gameplay systems](https://github.com/majidmanzarpour/threejs-game-skills/blob/main/skills/threejs-gameplay-systems/SKILL.md) | Explicit player verbs, objective, pressure, feedback, retry, deterministic ordering, and representative encounters | Add playable-increment criteria and data-driven balance; implement one encounter before content expansion |
| [Three.js QA/release](https://github.com/majidmanzarpour/threejs-game-skills/blob/main/skills/threejs-qa-release/SKILL.md) | Real input, progression, failure/retry, production preview, scoped viewport coverage; pixels alone do not prove gameplay | Strengthen behavior-based browser checks; responsive layout does not automatically require mobile gameplay |
| [Three.js FPS example](https://github.com/mrdoob/three.js/blob/dev/examples/games_fps.html) | Bounds frame delta and uses collision substeps | Require a suitable timestep strategy when needed; this example uses substeps, not a universal fixed-step mandate |
| [Three.js Timer implementation](https://github.com/mrdoob/three.js/blob/dev/src/core/Timer.js) | Reads time once per update and can reset timing after visibility changes | Add hidden-tab pause, resume-baseline, and separate simulation/decision-clock policies |
| [Vite static deployment guide](https://github.com/vitejs/vite/blob/main/docs/guide/static-deploy.md) | Repository Pages sites require the repository base path; root/custom-domain sites differ | Preserve `/ActionDBG/` for the standard deployment and test built asset URLs |

## Review findings and changes

1. **Core-loop acceptance was underspecified.** The previous instructions covered architecture and builds but did not require a representative playable encounter. Added scoped player-action, objective, pressure, feedback, and retry criteria. The movement demo retains its smaller validation purpose.
2. **Combat clocks and event chains needed operational rules.** Added explicit transitions, duplicate-trigger prevention, bounded phase chains, lethal-damage behavior, and simulation-driven timers. Numerical balance and unresolved hand/deck alternatives remain design decisions.
3. **Browser lifecycle handling was incomplete.** Added hidden-tab pause, held-input cleanup, resume timing, pointer-lock handling, audio unlock, and shared-resource ownership. These prevent tab-return jumps, stuck movement, and resource/listener leaks.
4. **Performance requirements lacked measurement context.** Added viewport/device and frame-time targets, representative-play measurements, pixel-ratio control, and profiling before optimization. No unsupported device guarantee or arbitrary global FPS requirement was introduced.
5. **UI and input rules were too general.** Added HUD/world input separation, control discoverability, readable eligibility feedback, keyboard-operable HTML controls, and explicit desktop-first scope.
6. **Build success could be mistaken for gameplay proof.** Added combat edge-case tests, injected time and seeded randomness, behavior assertions, production-preview checks, and separation of visual evidence from gameplay correctness.
7. **Asset provenance was missing.** Added source/license/attribution tracking for third-party assets and traceability for generated assets.

## Validation and remaining limitations

- Reviewed local document and skill references and Markdown formatting.
- Kept changes limited to project guidance and this review record; existing design and skill files are unchanged.
- The repository still has no application manifest, source, or test suite. Proposed commands and checks are future implementation requirements, not verified runtime capabilities.
- The external Three.js skill package is not installed in `.agents/skills/`; upstream files were consulted as research references.
- Reddit research remains blocked by Reddit's access policy after the environment domain changes were published and requests retried. The original proxy connection rejection has been resolved; no discussion content is available for review.
