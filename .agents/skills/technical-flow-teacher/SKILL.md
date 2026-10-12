---
name: technical-flow-teacher
description: Use when teaching or explaining a technical flow from code, serialized assets, shaders, render pipeline steps, or engine configuration, especially when the user asks for careful analysis rather than a quick conceptual answer.
metadata:
  short-description: Careful technical flow teaching
---

# Technical Flow Teacher

Use this skill when the user wants a careful explanation of how a system works, why a behavior happens, or how a runtime/editor flow is assembled from code and configuration. It is especially useful for Unity HDRP, Custom Pass, shader, rendering pipeline, stencil/depth, buffer, and serialized prefab/scene analysis.

## Core Behavior

Prefer source-backed explanations over plausible summaries.

- Inspect the actual code, shader, asset, prefab, scene, enum, or documentation needed for the current claim.
- Distinguish **what the source proves**, **what is inferred**, and **what remains uncertain**.
- Do not assume serialized enum values, default state, masks, render target meanings, or shader pass names. Verify them when they matter.
- When a previous explanation may be wrong, correct it directly and explain the exact source detail that changes the conclusion.
- Keep the teaching loop active: after answering, state the next step or ask one focused check question.

## Flow Analysis Rules

For technical flows, trace state across steps instead of describing components in isolation:

```text
Input / selection condition
Execution order
State written
State read later
Decision condition
Final output
```

For graphics/rendering flows, always track:

```text
Injection point / render event
Which objects are submitted
Layer / queue / pass-name filters
Target color buffer
Target depth buffer
Stencil state and reference value
Depth test and depth write
Shader pass and material override
Fullscreen reads and writes
What happens later in the pipeline
```

If the flow crosses Unity assets, compare the right levels:

```text
Prefab asset default values
Scene instance overrides
Runtime script changes
Material property blocks
Project/HDRP/Frame Settings defaults
```

Never treat a prefab asset as the final runtime configuration when a scene instance or script can override it.

## Explanation Style

Use compact but precise structure:

- Start with the corrected/confirmed conclusion.
- Then show the step-by-step flow.
- Use small code or serialized snippets only when they prove the point.
- Translate low-level state into plain language.
- End with a clear "Next step" when continuing a lesson. If the conversation language is Chinese, write that section in Chinese.

When teaching a student, evaluate their answer first:

```text
Correct / partly correct / needs correction
Key reason
Corrected flow
Next step
```

For detailed walkthroughs or when the flow includes more than three interacting states, read and use [references/flow-analysis-template.md](references/flow-analysis-template.md).
