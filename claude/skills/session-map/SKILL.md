---
name: session-map
description: Writes the session map, the pre-compaction handoff at `.claude/tasks/session-<slug>.md`, from any session whatever role it holds, running the skill-drift step the write procedure opens with. Use when asked to "write the handoff", "write the session map", "save the session before it compacts", "we are about to compact", "hand off to the next session", or "leave a note for whoever picks this up". Do NOT use to route session facts to a context entry or the memory folder, which is `claude-memory-capture` and writes a different artifact, and do NOT use to read a handoff back, which is `session-resume`.
---

# Session map

Write the pre-compaction handoff for the current session. `${CLAUDE_SKILL_DIR}/../../standards/session.md` fixes the filename, the frontmatter, the three core sections, the numbered write procedure, and the citation rule. Follow that document rather than this body, which states when the procedure runs and what it runs against and leaves the shape where it already lives.

Any session writes one. Do not assert a role on invocation, and do not add a role's sections to a map written by a session holding no such role.

## Guards

- If `git rev-parse --git-dir` does not resolve, stop: `❌ Not a git repository. A session map takes its filename from the branch.`
- Derive `<slug>` per `${CLAUDE_SKILL_DIR}/../../standards/slug.md`. An empty result falls back to `latest` rather than stopping, since a handoff is scratch and a stop loses the reasoning the file exists to save.
- Resolve the containing folder at the main worktree root with `git worktree list --porcelain | grep -m 1 '^worktree ' | cut -d' ' -f2-`. The guard above already stopped where that read has no repository to answer from, so it takes no fallback.

## Step 1: run the capture the procedure opens with

Item 1 of `## Writing one` is a capture. Invoke `aitk:claude-memory-capture` and let it return before writing, so the map cites what was written instead of restating the same lesson in prose. Report nothing about what it wrote. The map is this skill's output.

## Step 2: recover the commit the drift step reads

Item 2 runs `aitk claude skills drift <ref>` against the commit this session started from, and nothing on the machine records that commit. Estimate how long the session has run, round the duration up, and read the ref item 3 recovers:

```bash
git log -1 --format=%H --before='<duration> ago'
```

Round up rather than down. A ref older than the oldest load over-reports, and confirming a name it raises costs one read of that body, so the generous end is the safe one.

Record what the verb names under `## Standing cautions`. A refusal is the boundary of what the verb can read rather than a fault, since it answers where the working directory carries `claude/skills/` with history behind it and refuses in a project consuming the plugin from a cache. Record the boundary and keep writing.

## Step 3: write the map

Follow items 4 through 6. Write only what a compaction destroys and no other artifact already carries, and cite a commit, a task, or a file and line for every claim.

The file sits at the main worktree root, which the file-editing tools refuse from inside a linked worktree while offering a copy under that worktree instead. Take neither the refusal nor the copy. The map is written whole every time, so send it out as one plain shell command carrying a heredoc.

## Step 4: extend it only where a role is held

`## Extending it` governs a section added over the core three. Add one only when this session holds the role and the surface owning that role states the section, since a section the writer cannot fill teaches its reader to skip the file. A session holding no role writes the core three and stops.

## Output

```plaintext
✅ Session map written: .claude/tasks/session-<slug>.md
<what the drift verb named, or the boundary it refused at>
```

Emit the path from the project root. The `## Output` section of the project's instruction file sets the form it takes.
