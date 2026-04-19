Recap the implementation just completed. Read the plan file referenced in the session (usually `.claude/plans/feature-<slug>.md`) and produce a verification block.

Output this shape, nothing else:

```markdown
**Deliverable 1**: <name from the plan>

- `path/to/file`: one-line reason

**Deliverable 2**: <name from the plan>

- `path/to/file`: one-line reason

**Verified**: <what was smoke-tested or `Nothing tested in session.`>

**Open**: <unresolved questions, deferred items, or `None.`>
```

Group files by deliverable, not by directory. Keep each line scannable. Do not restate the plan body.
