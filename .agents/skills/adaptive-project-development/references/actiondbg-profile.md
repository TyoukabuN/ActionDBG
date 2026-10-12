# ActionDBG Profile

Apply this profile only when working in the ActionDBG repository. Repository `AGENTS.md` remains authoritative if it changes.

## Sources And Language

- Read `doc/project-purpose.md` and `doc/design/protoTypeImages.md` before defining gameplay scope.
- Read task-relevant documents under `doc/prd/` and existing feature artifacts before changing requirements.
- Write player/product PRDs in Chinese.
- Write new technical Design, Implementation Plan, Tasks, Verification, code, and identifiers in English unless the user explicitly requests otherwise.
- Preserve existing Chinese design documents unless translation is requested.

## Artifact Location

Follow existing document locations for current features. For a new Full-track feature without an established location, prefer:

```text
doc/features/<feature-slug>/
  prd.md
  design.md
  implementation-plan.md
  tasks.md
  verification.md        # only when durable evidence is useful
```

Do not migrate unrelated documents simply to adopt this structure. Project-wide vision stays in `doc/project-purpose.md` and `doc/design/`.

## Gameplay Scope

- Treat `protoTypeImages.md` as design intent, not implemented behavior.
- Keep the pipeline-validation prototype separate from the representative combat encounter.
- Prove one playable encounter before expanding cards, enemies, routes, assets, or frameworks.
- For each slice state player action, objective, pressure/tradeoff, feedback, and completion/failure/retry.
- Keep hand retention, cooldowns, draw/discard, formulas, and phase chaining open until a scoped experiment approves them.

## Full-Track Triggers

Use Full for ActionDBG changes involving:

- combat states or contextual phase chaining;
- simulation time versus decision-window time;
- event ordering, damage resolution, lethal cancellation, duplicate triggers, or bounded chains;
- input/focus/pause/restart lifecycle;
- shared asset ownership or teardown;
- persistent progression, route state, save data, or content schemas.

## Design Expectations

Design must keep gameplay rules independent of Three.js, DOM, and browser input. Rendering and input adapt the simulation.

Define when relevant:

- explicit states and allowed transitions;
- which clock advances each timer;
- frame delta bounds or fixed-step behavior;
- hidden-tab, blur, resume, restart, and lethal-damage behavior;
- resource consumption and rejected actions;
- trigger eligibility, ordering, deduplication, and chain bounds;
- initialization, stop, teardown, and restart ownership.

Do not introduce a backend, multiplayer, complex ECS, editor, custom engine, Unity, or Unreal without a separate authorized requirement.

## Implementation Handoff

When implementation and delegation are authorized, use `sol-luna-dev` for Luna execution. The lead owns design, plan, task readiness, review, and artifact updates. Workers receive narrow tasks and must preserve unrelated and user-owned changes.

## Validation

For gameplay changes, normally require:

- strict type checking;
- focused rule tests, including rejected and terminal behavior;
- production build;
- browser smoke test with real input when browser execution is available;
- console/page-error inspection and responsive canvas checks when relevant;
- GitHub Pages base-path validation for affected assets or routing.

Report each check separately. Documentation-only work needs content, link, structure, and diff review rather than unrelated game builds.
