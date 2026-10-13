# Three.js Game Skills — Installed Source

Installed: 2026-10-13, project-local under `.agents/skills/`.
Upstream: https://github.com/majidmanzarpour/threejs-game-skills
Revision: `8286774b22a2566bf894dbc825825c16921866af`.
License: MIT, copyright 2026 Majid Manzarpour. A copy is retained as `LICENSE.upstream.txt` in each installed skill directory.

Installed the complete upstream skill directories, including agent metadata, references, scripts and bundled scaffold/asset files:

- `threejs-game-director`
- `threejs-gameplay-systems`
- `threejs-game-ui-designer`
- `threejs-aaa-graphics-builder`
- `threejs-debug-profiler`
- `threejs-qa-release`
- `threejs-3d-generator`
- `threejs-image-generator`
- `threejs-audio-generator`

All 74 upstream files were verified byte-for-byte against the checkout before committing. Existing project skills were preserved. Literal Markdown reference targets resolve apart from a sample output-artifact link in the evidence-manifest template; that is an example user-created capture, not a missing skill resource.

No upstream installation or helper scripts were executed. The bundled scaffold was not copied over the game. This installation does not add runtime dependencies, enable new browser/MCP tools, configure model providers, or invoke paid asset generation. Generator credentials remain optional and task-dependent.

For broad game work, use `$threejs-game-director`; for an isolated HUD task use `$threejs-game-ui-designer`, and for an isolated QA task use `$threejs-qa-release`. Repository/user constraints still govern scope: existing Three.js/TypeScript/Vite architecture, fixed-card experiment, desktop target and GitHub Pages. Premium graphics and external generation require an actual requested task scope.

Future updates should compare against this revision, preserve local changes, copy complete skill resources and retain attribution. Automatic skill discovery may require a new task/session; the files can also be read explicitly in the current checkout.
