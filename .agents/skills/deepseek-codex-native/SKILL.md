---
name: deepseek-codex-native
description: Use when the user asks to configure DeepSeek as a native Codex model provider through the official Responses API, switch Codex between GPT and DeepSeek, repair DeepSeek Codex configuration, or package a repeatable DeepSeek Codex setup workflow with switch-to-ds.ps1 and switch-to-gpt.ps1.
---

# DeepSeek Codex Native Integration

## Goal

Connect DeepSeek as a native Codex model provider instead of using the DeepSeek Code Worker MCP.

This mode switches the main Codex model provider. It is not the same as "GPT plans, DeepSeek executes" dual-model collaboration. If the user wants GPT as the main planner and DeepSeek as a worker, use the `deepseek-code-worker` MCP workflow instead.

Core deliverables:

- Configure the user-level Codex config directory with a DeepSeek provider.
- Preserve or create a rollback profile for GPT.
- Create `switch-to-ds.ps1` and `switch-to-gpt.ps1` for daily model switching.

## Safety Rules

Never expose the DeepSeek API key in replies, logs, command output, patches, or repository files.

DeepSeek official Codex integration examples may write the key into the user-level `config.toml`. Before doing that, explicitly tell the user this is local user configuration and must not be committed to Git.

Write configuration to the user-level Codex directory by default:

- Use `$env:CODEX_HOME` when it exists.
- Otherwise use `%USERPROFILE%\.codex` on Windows and `~/.codex` on Unix-like systems.

Do not start, restart, or kill Codex unless the user explicitly asks. Modify static configuration and tell the user to open a new Codex process for changes to take effect.

## Integration Workflow

1. Check the current DeepSeek official documentation first:
   - `https://api-docs.deepseek.com/zh-cn/quick_start/agent_integrations/codex/`
   - `https://api-docs.deepseek.com/zh-cn/guides/responses_api/`
2. Confirm the current model names supported for Codex Responses API from official documentation. Do not assume `deepseek-v4-flash`, `deepseek-v4-pro`, or any other model remains valid.
3. When reading existing Codex config, redact secrets. Only report whether fields such as `model`, `model_provider`, `model_catalog_json`, `[model_providers.deepseek]`, and `experimental_bearer_token` exist. Do not print token values.
4. Prefer having the user run DeepSeek's official setup script interactively in their own terminal and enter the API key themselves.
5. If Codex must modify configuration directly, create a timestamped backup first and preserve unrelated MCP, profile, approval, sandbox, and other existing config sections.
6. After DeepSeek configuration is complete, create model profiles and the two switch scripts.

## Required Files

Create these files under the user-level Codex directory:

- `switch-to-ds.ps1`
- `switch-to-gpt.ps1`

Also create:

- `model-profiles/config.deepseek.toml`
- `model-profiles/config.gpt.toml`
- `model-profiles/models.deepseek.json`, when DeepSeek configuration references a model catalog file.

Switch scripts must:

- Use the script directory as the Codex directory, or explicitly resolve `$env:CODEX_HOME`; do not hardcode a username.
- Check required files before switching and fail with clear errors when they are missing.
- Exit cleanly when the active config already points to the target provider.
- Save the current `config.toml` back into the matching profile before switching, preserving later manual edits.
- Restore DeepSeek `models.json` before restoring DeepSeek `config.toml` in `switch-to-ds.ps1`.
- Restore GPT `config.toml` in `switch-to-gpt.ps1`.
- Never print the DeepSeek API key.
- Only switch config files; do not start Codex automatically.

Recommended PowerShell skeleton:

```powershell
$codexRoot = if ($env:CODEX_HOME) {
    $env:CODEX_HOME
} else {
    Split-Path -Parent $PSCommandPath
}

$activeConfig = Join-Path $codexRoot 'config.toml'
$profileDir = Join-Path $codexRoot 'model-profiles'
$gptProfile = Join-Path $profileDir 'config.gpt.toml'
$dsProfile = Join-Path $profileDir 'config.deepseek.toml'
```

When generating scripts, expand this skeleton into complete scripts and validate them against the local file layout.

## Validation

After configuration, run static validation:

- When `config.toml` points `model_provider` to DeepSeek, `wire_api` must match the current official Responses API configuration.
- `experimental_bearer_token` may only be checked for presence/non-empty value; never output it.
- The file referenced by `model_catalog_json` exists and contains valid JSON.
- GPT and DeepSeek profiles both exist.
- Both `switch-to-*.ps1` scripts pass PowerShell syntax checks.

Run a minimal smoke test only when the user explicitly allows possible API cost. Otherwise report static validation results and explain that Codex must be restarted or reopened for changes to take effect.

## User Instructions

Tell the user:

- To switch to DeepSeek, run `switch-to-ds.ps1`, then restart Codex or open a new Codex process.
- To switch back to GPT, run `switch-to-gpt.ps1`, then restart Codex or open a new Codex process.
- The "restore default" or "delete backup" option in DeepSeek's official setup script is for uninstall/reset flows, not daily switching.
