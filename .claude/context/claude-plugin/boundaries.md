---
title: Boundaries
description: Where built-in Claude Code features overlap toolkit skills and how the two compose
---

# Built-in vs toolkit features

Claude Code includes built-in features that overlap with some toolkit skills. They serve different purposes and are complementary.

## Code review

| Aspect   | Claude Code Review (built-in)                   | `claude-review` skill                                                             |
| -------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| What     | Managed service that reviews PRs on GitHub      | Local skill that reviews diffs in terminal                                        |
| Trigger  | Auto on PR push, or `@claude review` on a PR    | `/claude-review` in a Claude Code session                                         |
| Context  | Reads the full repo on Anthropic infrastructure | Reads project docs (REQUIREMENTS, ARCHITECTURE) plus auto-loaded `.claude/rules/` |
| Output   | Inline PR comments with severity tags           | Terminal findings grouped by file                                                 |
| Best for | Post-push review on GitHub                      | Pre-push local review aware of project docs and governance                        |

Use both: run `claude-review` locally before pushing, then let Code Review catch anything on the PR.

## Planning

| Aspect     | Plan mode                                        | Ultraplan                                               | `claude-feature` skill                                                                                                                                              |
| ---------- | ------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What       | Permission mode: Claude explores but cannot edit | Cloud-based plan drafting with browser review UI        | Skill that reads project docs and proposes files to touch                                                                                                           |
| Activation | `Shift+Tab` or `/plan`                           | `/ultraplan` or the word "ultraplan" in prompt          | `/claude-feature`                                                                                                                                                   |
| Output     | Free-form plan in terminal                       | Rich plan in browser with inline comments and reactions | Structured output: summary, files to touch, risks, and questions that each carry a suggested answer                                                                 |
| Context    | Whatever Claude reads during exploration         | Same, but on cloud infrastructure                       | Explicitly reads REQUIREMENTS, ARCHITECTURE, DESIGN, the task board, and the relevant `.claude/wireframes/<surface>.md`. Coding rules in `.claude/rules/` auto-load |

Plan mode is a permission mode that restricts Claude to read-only exploration. `claude-feature` is a structured prompt that forces a specific output format and reads specific project docs. They solve different problems and can be used together: enter plan mode, then invoke `claude-feature` for a scoped proposal grounded in your project docs.

`claude-groundwork` sits ahead of all three. It runs before a topic is ready to plan, and its output is a scratch folder that can conclude in doing nothing. Reach for it when the current state is unmeasured and more than one approach is live, then run `claude-feature` on the decision it produces.

### Groundwork experiments

A track may run its own experiments. Reading and computing were always in scope, so the permission that mattered is the fixture write, and it lands under `.claude/.tmp/groundwork-fixtures/<slug>/` rather than inside the track folder so mode detection never matches a fixture as a track. A billed headless run is bounded by a count of three rather than by a dollar figure, because a headless run reports its total cost only after it finishes, which makes a budget reportable and not enforceable while a count is checkable before spawning. The record lands in `08-spikes.md`, the one reserved number sitting after the closing files, because it holds evidence rather than a topic.

The fixture path splits by who reads it. A fixture this session provisions and reads itself is fine in-repo, and a fixture a headless run is pointed at has to sit outside the repository under `mktemp -d`. A session started anywhere beneath the project root inherits that project's `CLAUDE.md`, `.claude/rules/`, and `.claude/standards/` through the ancestor chain, so an in-repo arm measures the repository rather than the thing under test. `scripts/eval/run.sh` already extracts to `mktemp -d` for this reason and carries the reason in a comment, which is the isolation a track should copy along with the assertions.

## Running the app

| Aspect   | `run` (built-in)                                             | `project-commands` skill                                  |
| -------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| What     | Launches the app and drives it to confirm a change works     | Runs a command the project documents, then stops          |
| Sources  | Falls back through built-in patterns per project type        | Reads the development context entry and nothing else      |
| Ends at  | A verified app: logs read, browser driven, screenshots taken | The launch: the port or exit status, and nothing after it |
| Best for | Confirming a change behaves in the real app                  | Starting something to use, or running a check             |

The built-in delegates to a project skill when it finds one, so the two compose rather than compete. The split is the stop condition. `run` continues past a passing health check by design, because its job is confirming a change. That is the wrong shape for "start the server so I can use it", which is the request `project-commands` answers.

## Background session isolation

Claude Code isolates a `claude --bg` session into its own `.claude/worktrees/` entry automatically, but only lazily: the move happens right before the session's first file edit rather than at dispatch. `claude-autoship` Step 0 calls `EnterWorktree` through `claude-worktree` ahead of any edit tool, so a worker dispatched through the ship chain never observes the built-in trigger firing at all. Its own explicit move always lands first.

A session read taken in the first seconds after dispatch, before either mechanism has moved it, reports the main worktree as `cwd` and `main` as the branch regardless of which one would have isolated it. That reading settles nothing about whether the built-in default is active, only that neither mechanism has run yet.

## Only one variable expands in a skill body

`${CLAUDE_SKILL_DIR}` is substituted into a skill body before the model sees it, while `${CLAUDE_PLUGIN_ROOT}` arrives as a literal string and a bare `../../` arrives unresolved, so only the first names a path without inference. Three probe skills in a project with no `.claude/` all reported the standard's sentinel, which reads as three working forms until the resolved paths separate them: the `${CLAUDE_SKILL_DIR}` arm quoted an absolute path and the other two quoted the literal text and guessed a base correctly. A form that works by inference fails wherever the inference goes to the session cwd. Ask a probe for the path it resolved rather than the content it read, since content alone cannot distinguish expansion from a lucky guess.

The no-fallback rule is what keeps the boundary sharp. A skill that guesses at a command source when the entry is missing becomes a second launcher, and the two would then disagree about what a project runs.

Both skills close their questions with a lean, and the two leans differ in strength on purpose. A plan's `- Suggested:` is decision-ready, so a blank `- Answer:` means accept it at execution time. A groundwork `- Leaning:` is weaker: it records where the evidence currently points on a question still open by definition, and pairs with an `- Overturned by:` line naming what would change it.

Collapsing the two would turn a groundwork track into premature planning, the failure the container exists to prevent. A measurement question carries no lean at all, since a guess at a number is worse than an admission.
