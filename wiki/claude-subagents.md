---
title: Claude Code subagents
description: When and how a skill should spawn a subagent, parallel vs sequential, and pitfalls
---

# Claude Code subagents

A subagent is a separate Claude session spawned from the main thread through the `Agent` tool. It runs in its own fresh context, does its own tool calls, and returns a single final message to the parent. Subagents are the right tool when a task needs independence, isolation, or parallel lenses that a same-session invocation cannot give.

See [Anthropic's subagent docs](https://code.claude.com/docs/en/sub-agents) and the [SDK reference](https://code.claude.com/docs/en/agent-sdk/subagents) for the canonical behavior.

## What a subagent sees

A spawned subagent inherits nothing from the parent conversation. It gets its own system prompt, the prompt string passed through the `Agent` tool, the project's `CLAUDE.md`, and whatever tools the parent chose to expose. Parent messages, prior tool results, and session history do not cross the boundary.

Only the subagent's final message returns to the parent. Intermediate tool calls, file reads, and scratch thinking stay inside the subagent and do not bloat the caller's context. This is the property to exploit.

The parent-to-subagent channel is the prompt string alone. Any file paths, error messages, constraints, or decisions the subagent needs must be written into that prompt. A terse prompt produces shallow, generic work.

## Invocation mechanisms

Three paths reach a subagent from inside Claude Code:

- `Agent` tool: the built-in interface. Pass `description`, `prompt`, and `subagent_type`. Built-in types include `general-purpose`, `Explore`, and `Plan`. The tool was named `Task` before v2.1.63.
- Skill frontmatter: set `context: fork` and `agent: <type>` in a `SKILL.md` to run the skill body itself inside a forked subagent. See [Claude Code skills](claude-skills.md) for the full frontmatter reference.
- Filesystem agents: drop a markdown file with YAML frontmatter under `.claude/agents/` for project scope or `~/.claude/agents/` for personal scope. These load at startup and do not hot-reload during a session.

Subagents cannot spawn their own subagents. Do not list `Agent` in a subagent's allowed tools.

## When a skill should reach for one

Three cases justify a subagent. If none apply, a same-session step is cheaper and clearer.

### Independence

The subagent must not inherit reasoning from the caller. Code review is the canonical case. An implementer's context biases the reviewer toward rationalizing the approach that was just written. A cold subagent starts from the diff and the standards and sees the code the way a new reviewer would.

The [claude-autoship skill](../claude/skills/claude-autoship/SKILL.md) uses this pattern in step 5: it spawns a subagent to invoke `toolkit:claude-review` so the review cannot absorb implementation context from the same session.

### Context isolation

The task burns a large amount of context that the parent does not need. Exploring a codebase to answer one question, summarizing a long log, or collating search results across dozens of files all produce a lot of intermediate state. Delegating to a subagent returns only the answer and keeps the main thread focused on the active work.

### Parallel lenses

Several independent reviews of the same artifact run faster as separate subagents than as one sequential prompt. Security, style, and test-coverage passes over the same diff is the stock example. Each subagent has its own tailored prompt and returns its own finding set.

## Parallel vs sequential

Launch subagents in parallel by emitting multiple `Agent` tool calls inside a single assistant message. The harness fires them concurrently. Use this when the lenses are independent and the parent does not need one result to inform the next.

Run them sequentially when a later subagent needs output from an earlier one, or when ordering matters for user-visible state (for example, review before ship). The cost is wall time.

Do not launch parallel subagents just because you can. Each spawned session pays its own startup and context cost. If the work is small, inline it.

## Pitfalls

- Under-briefed prompts. The subagent cannot see what the parent knows. Write the prompt as if onboarding a colleague who just walked in: goal, relevant file paths, constraints, and what "done" looks like.
- Confusing subagents with skills. A skill is reusable instructions the main agent follows. A subagent is a separate session. Skills with `context: fork` become subagent invocations at runtime, but a plain `/skill-name` call does not.
- Over-delegation. Spawning a subagent for a two-file read wastes time and hides the work from the user. The parent should handle anything where the full context already fits and the reasoning is not required to be cold.
- Filesystem agent staleness. Edits to `.claude/agents/*.md` take effect only on session restart.
- Windows prompt length. Very long prompts can hit the 8191-character command-line limit on Windows. Split or shorten before passing.
- Hidden risky decisions. A subagent's internal steps are not visible to the user in the main transcript. Do not delegate work with irreversible side effects without a review step in the parent.

## Related

- [Claude Code skills](claude-skills.md) for the `context: fork` frontmatter fields
- [Claude Code hooks](claude-hooks.md) for `SubagentStart` and `SubagentStop` events
- [Community skills and plugins](community-skills.md) for third-party patterns like `subagent-driven-development`
