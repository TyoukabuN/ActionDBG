# Skills for the Current ActionDBG Prototype

Reviewed: 2026-10-13. Scope: discovery and source review, not installation or gameplay changes.

## Project fit

ActionDBG already uses plain Three.js, strict TypeScript, Vite, a DOM card HUD, a deterministic combat state machine and Playwright. The current encounter has fixed retained cards, no draw/discard system, limited counter chaining, two clocks and a rear diagonal battle camera. The immediate needs are stronger game-specific visual direction, readable combat feedback and visual/behavioral playtesting. Additional architecture orchestration is already provided by `adaptive-project-development` and `sol-luna-dev`.

## Recommended sources

| Candidate | Useful responsibility | Fit and limits |
| --- | --- | --- |
| [OpenAI Game Studio: three-webgl-game](https://github.com/openai/plugins/blob/0722921d5542fc593105c27bd52630babd8b8c2a/plugins/game-studio/skills/three-webgl-game/SKILL.md) | Plain TS/Vite Three.js runtime, explicit cameras, simulation/render separation, DOM HUD | Strong direct stack fit. Do not add Rapier or GLB loading until the encounter actually needs physics or shipped models |
| [OpenAI Game Studio: game-ui-frontend](https://github.com/openai/plugins/blob/0722921d5542fc593105c27bd52630babd8b8c2a/plugins/game-studio/skills/game-ui-frontend/SKILL.md) | Game-themed visual direction, playfield protection, contextual HUD and collapsed secondary panels | Strong fit for reducing the current dashboard-like presentation. Its sparse exploration HUD and mobile defaults must be adapted: card choices/AP/intent remain essential, and this prototype is desktop-only |
| [OpenAI Game Studio: game-playtest](https://github.com/openai/plugins/blob/0722921d5542fc593105c27bd52630babd8b8c2a/plugins/game-studio/skills/game-playtest/SKILL.md) | Real-input browser QA, mandatory screenshot review for WebGL, issue reproduction/severity | Strong fit. Reuse the existing Playwright setup rather than adding a second test system |
| [Three.js Game Skills](https://github.com/majidmanzarpour/threejs-game-skills) | Game-specific UI, gameplay feel, graphics critique and QA | Still a strong community option: prioritize `threejs-game-ui-designer`, `threejs-gameplay-systems` and `threejs-qa-release`. Use graphics scoring only when visual polish is requested; do not automatically trigger paid asset generation |
| [Anthropic frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | Deliberate typography, visual identity, themed layout and critique | Useful optional specialist for HTML/CSS card/HUD art direction. Not a combat-rule or 3D-animation skill; avoid turning the game into a marketing-page layout |
| [Card Game](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/genres/card-game/SKILL.md) and [effect-resolution reference](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/genres/card-game/references/effect-resolution.md) | Card data, atomic cost/target validation, explicit effect order and trigger handling | Selective domain reference. Its must-have deck/draw/discard loop conflicts with the current fixed-hand PRD. Adopt relevant rules, not the complete genre template or Godot/Unity dependencies |
| [Yuki001 game-architect](https://github.com/Yuki001/game-dev-skills/blob/main/skills/game-architect/SKILL.md) | Prototype versus data/domain architecture, time/skill/effect system knowledge | Optional reference for later expansion. It is domain knowledge rather than workflow; retain existing governance and avoid introducing DDD/module frameworks for this one encounter |

## Best next combination

Choose one main implementation/QA family to avoid competing directions:

1. **For current UI/scene iteration:** Game Studio's `three-webgl-game`, `game-ui-frontend` and `game-playtest` specialists. The umbrella skill defaults to 2D Phaser, so explicitly route to the already established plain Three.js stack.
2. **For action feel and a deliberate graphics pass:** the existing Three.js Game Skills family. Its gameplay reference treats feedback as state communication and covers anticipation/contact, easing, impact and camera response. Keep separate visual feedback time and decision time; introducing hitstop must not accidentally pause or consume a decision window.
3. **For a card-rule extension:** selectively consult Card Game's effect-resolution reference and use the existing PRD/design workflow. Do not add draw/discard, targeting frameworks or more phases before they become approved requirements.

`frontend-design` is a supplement, not another director. An initial visual task should set a clear combat fantasy, palette/type scale, large readable card costs, near-player/far-opponent camera, persistent decision information, and a collapsible combat log. Evaluate it during play rather than accepting a static screenshot alone.

## Sources examined and exclusions

Discovery used three Exa GitHub searches (five results each) and one Tavily Reddit search (four results). Useful candidates were read directly from upstream raw GitHub sources. No candidate helper script was executed and no benchmark establishes that a skill improves the game yet.

- OpenAI plugins were inspected at commit `0722921d5542fc593105c27bd52630babd8b8c2a`. The Game Studio manifest identifies OpenAI as author, version 0.1.2, MIT license, and a skill directory. Its main, Three.js, UI and playtest skills and HUD reference were read. This is a first-party complement to community sources, not a community endorsement.
- The current [openai/skills README](https://github.com/openai/skills/blob/main/README.md) explicitly marks that repository deprecated and points to `openai/plugins`. The old `develop-web-game` skill was readable at historical revision `82d2c5b4`, while its current main path returned 404. Prefer the verified current Game Studio package instead of copying a stale mirror.
- The upstream Three.js UI/graphics skill files and gameplay `game-feel.md` were read. Anthropic frontend-design and its Apache-2.0 license were read. Card Game and its effect-resolution reference and root Apache-2.0 license were read. Game Architect's skill and prototype-design reference were read. Non-pinned branch links can change after this review.
- [Jeffallan game-developer](https://github.com/Jeffallan/claude-skills/blob/main/skills/game-developer/SKILL.md) was not selected: its Unity/Unreal, ECS, networking, pooling and platform-wide performance requirements do not fit this browser prototype.
- [Claude Code Game Studios team-combat](https://github.com/Donchitos/Claude-Code-Game-Studios/blob/main/.claude/skills/team-combat/SKILL.md) was not selected: extensive team delegation and repeated stage/write confirmations overlap with existing governance and impede the desired small iteration loop.
- [full-statck-skills threejs-camera](https://github.com/full-statck-skills/threejs-skills/blob/main/skills/threejs-camera/SKILL.md) is a useful technical camera reference, but does not establish cinematic composition or combat UI direction. It is optional rather than a main game skill.
- [alton47/threejs-skills](https://github.com/alton47/threejs-skills) was reviewed at README level only. Its self-description as official was not independently established; broad Three.js API coverage is not evidence of stronger gameplay guidance.

Reddit discovery returned [a Three.js skill-system discussion](https://www.reddit.com/r/claudeskills/comments/1u7qdf6/threejs_game_director_skill_system_for_codex) and related AI game-development threads. These were provider snippets only, sometimes with unrelated navigation text. Full posts/comments and reliable community sentiment were not verified. They were not used to rank skills or claim consensus.

## Installation implications

No skills/plugins were installed during the discovery phase. Subsequently, the complete nine-skill Three.js Game Skills package was installed in `.agents/skills/` at revision `8286774b22a2566bf894dbc825825c16921866af`; see the [source record](../../.agents/skills/threejs-game-skills-source.md). Game Studio and the other candidates are not installed. Game Studio skills reference sibling skills and plugin-level `../../references/`; copying one SKILL.md into `.agents/skills/` alone breaks those paths. Prefer the complete supported plugin package, or preserve/adapt all referenced resources deliberately when making a project-local skill distribution. Preserve upstream provenance/licenses and existing local skills.

Plugin source review does not establish that the plugin is callable in this cloud conversation. API access, browser tools and paid generation remain separate capabilities. These candidates need an actual scoped implementation/playtest to establish practical benefit for ActionDBG.
