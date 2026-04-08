# Claude Code plan mode

Plan mode tells Claude to research and propose changes without executing them. Claude reads files and explores the codebase freely, but does not edit files or run commands. Use it when you want to see the full approach before anything changes.

## Entering plan mode

- Press `Shift+Tab` from default mode
- Prefix a single prompt with `/plan`
- Start a session with `claude --permission-mode plan`

## How it works

In plan mode, Claude reads files without restriction but requires approval for all writes, shell commands, and network requests. When the plan is ready, Claude presents four options:

- Approve and continue in auto mode
- Approve and auto-accept file edits only
- Approve and review each edit manually (default mode)
- Keep planning with feedback

Each option also offers to clear the planning context before proceeding.

## Exiting without approving

Press `Shift+Tab` again to leave plan mode without approving the plan.

## Ultraplan

Ultraplan runs planning on Anthropic's cloud infrastructure instead of locally. The terminal stays free while Claude drafts the plan. Output appears in a browser review UI on `claude.ai/code` with inline comments, emoji reactions, and section navigation. After review, implement on the web or teleport the plan back to your terminal.

Trigger it three ways:

- `/ultraplan <prompt>` as a slash command
- Include the word "ultraplan" anywhere in a normal prompt
- Choose "refine with Ultraplan" from the local plan approval dialog

Requires Team or Enterprise plan, a GitHub repo, and Claude Code on the web access (v2.1.91+).

## When to use it

Plan mode is useful before complex refactors, when exploring an unfamiliar codebase, or any time you want oversight of the direction before changes take effect. The key difference from default mode: Claude completes all analysis first, then waits for approval, rather than prompting action by action.
