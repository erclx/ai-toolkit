---
title: PowerShell profile for Claude Code
description: Profile snippet for the clp function, the built-in alias collision, PATH self-heal, jq CRLF output, and execution policy
---

# PowerShell profile for Claude Code

Windows has no `~/.zshrc`. `$PROFILE` fills the same role, but two problems only show up on this platform: PowerShell ships a built-in `clp` alias that outranks a same-named function, and a fresh install often has an execution policy that blocks the profile from loading at all. See [zshrc aliases for Claude Code](zshrc-aliases.md) for the macOS and Linux equivalent.

## The profile block

Find your profile path with `$PROFILE` in a PowerShell session. It resolves under `Documents\WindowsPowerShell\` (or `Documents\PowerShell\` on PowerShell 7+), redirected into OneDrive on machines where OneDrive manages Documents. Create the file if it does not exist, then add:

```powershell
$env:TOOLKIT = "C:\path\to\toolkit"

# Self-heal PATH for terminals that inherited a stale environment (common in VS Code)
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
  $claudeDir = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Directory -Filter "Anthropic.ClaudeCode_*" |
    Select-Object -First 1 -ExpandProperty FullName
  if ($claudeDir -and (Test-Path (Join-Path $claudeDir 'claude.exe'))) { $env:PATH = "$claudeDir;$env:PATH" }
}

# Remove the built-in Clear-ItemProperty alias before defining the function
if (Get-Alias clp -ErrorAction SilentlyContinue) { Remove-Item Alias:clp -Force }
function clp  { claude --plugin-dir "$env:TOOLKIT\claude" @args }
function clps { clp --model sonnet @args }
```

Open a new terminal, or run `. $PROFILE` in the current one, then confirm with `Get-Command clp`. It should report `Function`, not `Alias`.

## Why clp needs Remove-Item first

PowerShell resolves a bare command name in a fixed order: alias, then function, then cmdlet, then external executable. `clp` ships as a built-in alias for `Clear-ItemProperty`. Defining `function clp { ... }` without removing that alias first has no visible effect: the alias still wins, so `clp` keeps running `Clear-ItemProperty` and Claude Code never launches. `Remove-Item Alias:clp -Force` before the function definition clears the collision for the session, and the profile reapplies it on every new shell.

## PATH self-heal for stale terminals

VS Code's integrated terminal can inherit a PATH captured before the Claude Code CLI was installed, so `claude` resolves outside VS Code but not inside it until the editor restarts. The block above checks `Get-Command claude` first and only prepends the winget install directory when it is missing, so it stays a no-op once PATH is current.

## jq and the statusline script

`aitk claude setup` installs `~/.claude/statusline-command.sh`, which shells `jq` to parse Claude Code's JSON status payload. Two Windows-only failures show up here.

If `jq` is missing, install it with `winget install jqlang.jq`, then confirm with `Get-Command jq`. A stale PATH after install follows the same self-heal pattern as `claude` above.

The native Windows build of `jq` emits CRLF line endings. The script reads five values from `jq`'s output with `IFS= read -r`, so every value but the last keeps a trailing `\r`. An embedded `\r` moves the terminal cursor to column 0 mid-string, so the rendered statusline overwrites part of itself instead of raising a visible error. `tooling/claude/user/statusline-command.sh` strips it by piping the `jq` call through `tr -d '\r'` before the read loop.

## Execution policy

A fresh Windows install often ships with the `Restricted` execution policy, which blocks `$PROFILE` from loading with no error message. Nothing in the block above runs until this is fixed once per machine:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

`CurrentUser` scope avoids touching machine-wide policy and does not require an elevated prompt.
