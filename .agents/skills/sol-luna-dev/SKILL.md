---
name: sol-luna-dev
description: "Use for code-changing implementation, bug-fix, refactor, and optimization tasks that should follow a high-capability lead-agent plan, Luna worker implementation, and lead-agent review loop. Do not use for explanation-only or read-only review tasks."
---

# Sol Luna Dev

Use this skill when the user asks Codex to implement, modify, fix, refactor, or optimize code through the lead-agent -> Luna workflow, or explicitly asks for a Luna worker. The parent thread remains the high-capability lead agent: it owns analysis, architecture, decisions, scope control, and final review. Sol is a recommended lead role when the parent is already `gpt-5.6-sol`, but this workflow may also run under other capable parent configurations, such as `gpt-5.5` with high reasoning. Luna is only an implementation worker.

Do not simulate Luna by switching the parent conversation model. Use the current Codex subagent mechanism. Prefer the custom agent named `luna_worker` when the client can select custom agents. If the available spawn tool only supports a generic subagent with model override, spawn a worker with `model: "gpt-5.6-luna"` and include the Luna worker contract in the prompt. If neither custom-agent selection nor model override is available, still delegate through the supported subagent mechanism and explicitly report that the worker model is scheduler-selected.

## Workflow

1. The lead agent analyzes first.
   - Read applicable `AGENTS.md` files and the relevant code before delegation.
   - Run `git status` before worker edits and treat existing changes as USER OWNED CHANGES.
   - For complex tasks, identify current behavior, target behavior, root cause or key mechanism, files to change, implementation steps, risks, and validation.
   - For tiny edits, keep analysis brief, but still decide the scope before Luna starts.

2. The lead agent creates a bounded Worker Task.
   - Before the first delegation for a task, read [references/luna-worker-contract.md](references/luna-worker-contract.md).
   - Include: Goal, Context, Files / modules involved, Required changes, Constraints, Do not change, Validation steps, and Expected output.
   - Keep the write set narrow. For large tasks, split into sequential tasks and review each task before continuing.
   - Avoid parallel write-heavy workers unless their files are completely independent.

3. Luna implements.
   - Luna reads the task and relevant code, makes the smallest defensible change, runs requested checks when available, and reports changed files, build/test results, known issues, and deviations from the plan.
   - Luna must stop and report back if the lead agent's plan is clearly invalid or would require expanding scope.

4. The lead agent reviews.
   - Control returns to the lead agent after each worker run.
   - The lead agent must inspect the actual result, at least `git status` and `git diff`; use `git diff --stat` when practical.
   - Review whether the patch implements the request, follows the plan, stays in scope, avoids unnecessary refactors, and avoids API, serialization, data compatibility, performance, lifecycle, threading, null, and resource-release risks.
   - Build/test claims must be based on commands that actually ran or explicitly marked NOT RUN.

5. The lead agent sends targeted repairs if needed.
   - Do not ask Luna to reanalyze the whole task.
   - Send precise issues with file/line references when available, each with the required fix.
   - Limit automatic implementation/repair delegation to 3 worker iterations. After that, stop and tell the user the remaining issues.

## Final Response

Keep the user-facing closeout concise:

```text
Implemented:
- ...

Changed:
- ...

Validation:
- Build: PASS / FAIL / NOT RUN
- Tests: PASS / FAIL / NOT RUN

Lead review:
- ...

Remaining issues:
- ...
```
