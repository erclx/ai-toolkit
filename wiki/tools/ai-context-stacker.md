---
title: AI Context Stacker
description: VS Code extension that stages files into a named context stack and copies them as one formatted payload
---

# AI Context Stacker

[AI Context Stacker](https://marketplace.visualstudio.com/items?itemName=erclx.ai-context-stacker) is a VS Code extension that stages files and folders from the explorer into a named context stack, then copies that stack as a single formatted payload. Source: the `erclx` marketplace publisher, which builds and ships the extension outside this repository.

## Capabilities

A copied payload carries file contents plus an ASCII directory tree, ready to paste into any AI chat. Multiple named tracks hold separate stacks side by side. Token counting reports the payload size before it leaves the editor, and pinned files survive a stack clear.

## Where it fits

Use it to assemble context payloads for Claude chat sessions when Claude Code is not the right tool. Planning and architecture work is the usual case, where a curated subset of files reads better than the full project.
