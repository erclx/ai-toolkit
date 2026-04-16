---
title: Ollama
description: Local models via Ollama with tiers, context config, statusline, and web search
---

# Ollama

Run Claude Code against local models served by Ollama instead of the Anthropic API.

## Setup

### `ollama launch claude`

The fastest path. Ollama includes a dedicated launcher that sets all required environment variables automatically.

```bash
ollama launch claude --model <model>
```

This handles the three-model-tier mapping, base URL, and auth token in one command.

### Manual configuration

Set these environment variables before running `claude`:

```bash
export ANTHROPIC_AUTH_TOKEN=ollama
export ANTHROPIC_API_KEY=""
export ANTHROPIC_BASE_URL=http://localhost:11434
export ANTHROPIC_DEFAULT_HAIKU_MODEL=<model>
export ANTHROPIC_DEFAULT_SONNET_MODEL=<model>
export ANTHROPIC_DEFAULT_OPUS_MODEL=<model>
export DISABLE_TELEMETRY=1
```

Then start Claude Code with `--model`:

```bash
claude --model <model>
```

`ANTHROPIC_API_KEY` must be set to an empty string, not just unset. A stale key from a previous Anthropic subscription causes Claude Code to authenticate against Anthropic's servers even when `ANTHROPIC_BASE_URL` points at localhost.

`DISABLE_TELEMETRY=1` prevents Claude Code from fetching MCP server configs from `api.anthropic.com` at startup. Without it, the request can time out slowly and cause a startup hang.

## Model tiers

Claude Code maps tasks to three model tiers: Haiku (lightweight), Sonnet (standard), and Opus (complex reasoning). When only `--model` is set, background tasks fall back to Anthropic model names that Ollama does not recognize. Ollama returns 404, which surfaces as a "model may not exist" error.

Set all three `ANTHROPIC_DEFAULT_*_MODEL` variables to your local model. Point them at the same model or use different models per tier if multiple are available. `ollama launch claude` handles this automatically.

## Model requirements

### Tool calling

Claude Code requires tool calling support. Without it, the model degrades to a plain text generator that describes actions instead of executing them. Verify tool calling support on the model's Ollama page before using it.

### Dense vs MoE

MoE (mixture-of-experts) models load all weights into VRAM but activate only a fraction per token. An MoE model with a small active parameter count runs closer to a dense model of that size in speed while matching much larger models in quality. MoE models are a good fit for local inference where VRAM is the bottleneck.

Dense models use all parameters for every token. They need more compute per token but have simpler memory access patterns.

## Context window

Ollama picks a default context size based on available VRAM. Override it by setting `OLLAMA_CONTEXT_LENGTH` on the Ollama service.

Claude Code needs tens of thousands of tokens. The system prompt alone consumes ~24K. If the default is too low, increase it.

### Setting context on Linux (systemd)

Ollama runs as a systemd service. Environment variables in `.zshrc` or `.bashrc` are invisible to it. Set `OLLAMA_CONTEXT_LENGTH` on the service directly:

```bash
sudo systemctl edit ollama.service
```

Add:

```text
[Service]
Environment="OLLAMA_CONTEXT_LENGTH=<desired_size>"
```

Then reload and restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

### Verification

Check the actual context size with `ollama ps` while a model is loaded. The context column shows the real limit. Ollama silently truncates prompts that exceed it. Check server logs for `truncating input prompt` warnings.

### VRAM tradeoff

Larger context windows consume more VRAM for the KV cache. Going too high risks CPU offload, which drops inference speed significantly. Check VRAM usage with `nvidia-smi` or `ollama ps` and match the context size to available VRAM after the model weights are loaded.

## Statusline

Claude Code reports a hardcoded Anthropic context size for Ollama models. The total is wrong, but `used_percentage` is proportionally correct.

Fix this in a custom statusline script by querying `ollama ps` for the real context size. Use the Ollama value only for the total display. Calculate used tokens from the original `context_window_size` and `used_percentage`, since that percentage is relative to the hardcoded total.

```bash
real_ctx="$ctx_size"
if [[ "${ANTHROPIC_BASE_URL:-}" == *"localhost"* ]] && command -v ollama &>/dev/null; then
  ollama_ctx=$(ollama ps 2>/dev/null | awk 'NR>1 {print $7; exit}')
  [ -n "$ollama_ctx" ] && real_ctx="$ollama_ctx"
fi

used_k=$(awk "BEGIN {printf \"%.0f\", ($used_pct/100)*$ctx_size/1000}")
total_k=$(awk "BEGIN {printf \"%.0f\", $real_ctx/1000}")
```

The context value position in `ollama ps` depends on column layout. Columns like `SIZE` contain spaces (e.g. `20 GB`), which shift field numbering. Verify the correct field index with `ollama ps | awk 'NR>1 {for(i=1;i<=NF;i++) print i, $i}'`. The script reads the first loaded model and assumes only one is active.

## Web search

The built-in `WebSearch` tool returns 0 results with local models because it targets Anthropic's search backend. The tool appears available but is non-functional.

Add the [`ollama-mcp`](https://github.com/rawveg/ollama-mcp) MCP server to get working search via `ollama_web_search` and `ollama_web_fetch` tools. Search calls hit Ollama's cloud API while inference stays local. This requires an [Ollama API key](https://docs.ollama.com/capabilities/web-search).

Save the MCP config to `~/.claude/ollama-mcp.json` and use `--mcp-config` to load it only for local sessions, keeping it out of Anthropic-backed Claude:

```json
{
  "mcpServers": {
    "ollama": {
      "command": "npx",
      "args": ["-y", "ollama-mcp"],
      "env": {
        "OLLAMA_HOST": "https://ollama.com",
        "OLLAMA_API_KEY": "<your_key>"
      }
    }
  }
}
```

The model may still try the built-in `WebSearch` first. Tell it to use `ollama_web_search` instead, or instruct it in a system prompt to prefer MCP search tools.

## Performance

Local inference is significantly slower than the Anthropic API. Quality can be comparable depending on the model. GPU acceleration is effectively required.

## Useful commands

- `ollama list`: show downloaded models and sizes
- `ollama ps`: show loaded models with VRAM usage and context size
- `ollama pull <model>`: download a model
- `ollama stop <model>`: unload a model from VRAM
- `ollama rm <model>`: delete a model from disk

## References

- [Ollama Claude Code integration](https://docs.ollama.com/integrations/claude-code)
- [Ollama web search setup](https://docs.ollama.com/capabilities/web-search)
- [Three-model-tier fix](https://dan1t0.com/2026/01/19/claude-code-with-free-models-ollama-openrouter-setup/)
- ["Model may not exist" deep dive](https://www.rushis.com/fixing-the-model-may-not-exist-error-when-using-ollama-with-claude-code/)
- [Context window truncation](https://www.stepcodex.com/en/issue/ollama-launch-claude-wrong-model-context)
- [Web search and subagents](https://ollama.com/blog/web-search-subagents-claude-code)
