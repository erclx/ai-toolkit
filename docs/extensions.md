# Extensions

External browser and editor extensions used in the toolkit workflow.

## AI Context Stacker (VS Code)

[Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=erclx.ai-context-stacker)

Stages files and folders from the VS Code explorer into a named context stack, then copies them as a single formatted payload: file contents plus an ASCII directory tree, ready to paste into any AI chat. Supports multiple named tracks, token counting, and pinned files that survive stack clears.

Used in this toolkit to assemble context payloads for Claude chat sessions when Claude Code is not the right tool, for example during planning or architecture work where you want to bring in a curated subset of files rather than the full project.

## Caret (Chrome)

[Install from Chrome Web Store](https://chromewebstore.google.com/detail/caret/bpmdbibldelkpncegllkeegdpblgehgk)

A browser prompt library for Claude, Gemini, and ChatGPT. Type the trigger symbol (default `>`) in any chat input to open a searchable picker, select a prompt, and insert it without leaving the keyboard. Prompts are stored in the browser; sync from a GitHub repo is available as a manual pull.

Used during planning and chat sessions to insert saved prompts without copy-pasting. The trigger picker replaces manual clipboard workflows when working in Claude chat or Gemini.
