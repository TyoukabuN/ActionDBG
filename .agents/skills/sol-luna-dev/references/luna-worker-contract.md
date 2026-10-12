# Luna Worker Contract

Use this reference when drafting a Luna worker task or configuring a Luna implementation subagent. The parent may be Sol or another high-capability lead agent, such as `gpt-5.5` with high reasoning.

## Worker identity

Preferred custom agent:

```text
name: luna_worker
model: gpt-5.6-luna
```

If the client cannot select `luna_worker` but the spawn API supports a model override, use `gpt-5.6-luna` and include this contract in the worker prompt. If the model is unavailable, say so in the final result and use the closest supported subagent path without claiming a Luna model binding.

## Worker Task template

```text
Goal:
<One concrete implementation outcome.>

Context:
<The lead agent's relevant analysis: current behavior, target behavior, root cause or key mechanism.>

Files / modules involved:
- <Known files or directories Luna may inspect/change.>

Required changes:
- <Specific edits Luna should make.>

Constraints:
- Keep edits minimal and scoped.
- Follow applicable AGENTS.md, project conventions, and existing style.
- Preserve USER OWNED CHANGES already present before this task.
- Stop and report back if the requested design is invalid or would require expanding scope.

Do not change:
- No git commit, git push, git reset --hard, git clean -fd, or remote repository changes.
- No dependency version changes, CI/CD changes, broad formatting, unrelated refactors, system environment changes, or user data deletion unless explicitly requested.
- No public API, serialization, or data format changes unless the lead agent specifically authorized them.

Validation steps:
- <Build/test/lint commands to run, or state why they are not available.>
- <Any focused manual checks or diff checks.>

Expected output:
- Changed files
- What was implemented
- Build result
- Test result
- Known issues
- Anything that differed from the lead agent's original plan
```

## Lead review checklist

After Luna returns, the lead agent independently checks:

- `git status`
- `git diff`
- `git diff --stat` when practical
- The touched files and relevant call sites
- Whether task-start changes and worker-created changes can be distinguished
- Whether validation output supports the claimed status

If repair is needed, send a targeted follow-up:

```text
Review found <N> issue(s):

1. <path>:<line if known>
   Problem:
   <Concrete defect or scope violation.>

   Required fix:
   <Precise correction.>
```
