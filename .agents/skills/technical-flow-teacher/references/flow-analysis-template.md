# Flow Analysis Template

Use this reference when a technical explanation needs careful source-backed tracing.

## 1. Establish The Actual Configuration

Check the current source of truth before explaining:

```text
Code path:
Shader path:
Material path:
Prefab asset path:
Scene instance path:
Runtime script path:
Package/source enum path:
Documentation path:
```

Record whether each value comes from:

```text
asset default
scene override
inspector value
material property
material property block
runtime code
engine default
```

## 2. Decode Serialized Values

When a serialized asset uses numbers, resolve them:

```text
Enum numeric value -> enum name
Layer mask bits -> layer names
Stencil bit mask -> exact user bit(s)
Render target enum -> Camera / Custom / None
CompareFunction number -> LessEqual / GreaterEqual / Equal / etc.
Shader pass index -> pass name
```

Do not infer these from memory if local source exists.

## 3. Trace Writes And Reads

For each pass or step, fill this out:

```text
Step name:
Runs when:
Objects selected:
Target color:
Target depth:
Stencil state:
Depth state:
Shader/material:
Writes:
Reads:
Later consumer:
Visible result:
```

Then summarize the dependency chain:

```text
Step A writes X
Step B reads X and writes Y
Step C reads Y or final buffer shows Y
```

## 4. Graphics-Specific Checks

For Unity HDRP / Custom Pass / shader explanations, explicitly check:

```text
HDRP Asset support
Camera Frame Settings
Camera Volume Layer Mask
Custom Pass Volume mode and injection point
Custom Pass Volume priority
DrawRenderers queue filter
DrawRenderers layer mask
Override material/shader and pass name
Target color/depth buffers
Clear flags
Depth compare/write
Stencil ref/read mask/write mask/compare/pass/fail operations
Fullscreen fetch/read/write buffers
Whether the pass runs before or after fog, transparent, post-process
```

For depth/stencil, state the exact comparison:

```text
Depth test:
    fragment depth compared with target depth buffer using <function>

Stencil test:
    (stencilBufferValue & readMask) compared with (stencilReference & readMask)
```

If a reference value is omitted in code, inspect or state the default that applies.

## 5. Explain Alternatives

When the user asks "why not approach B?", compare by effect semantics:

```text
Approach A does object-space / geometry redraw / fixed-function gate.
Approach B does screen-space mask / fullscreen composition.
```

Compare concrete tradeoffs:

```text
Can it preserve object material shading?
Can it draw outlines by neighbor sampling?
Does it need a custom buffer?
Does it rely on depth/stencil?
Does it work before/after transparent?
Does it affect or get affected by fog/post-process?
Does it duplicate renderer draw cost or fullscreen pixel cost?
```

## 6. Teaching Close

End with:

```text
Corrected mental model:
Common pitfall:
Next step:
One focused quiz or observation task:
```

Avoid broad multi-question quizzes unless the user asks for review mode.
