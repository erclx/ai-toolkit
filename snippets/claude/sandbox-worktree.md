Provision a sandbox scenario from the current tree and launch Claude Code against it with the worktree's plugin dir. Works in linked worktrees and picks up uncommitted skill or script edits.

1. Run `pwd` and capture it as `TREE`. Confirm it is the root of a toolkit tree (main repo or linked worktree).
2. Pick a scenario from `ls scripts/sandbox/*/*.sh`, using the `<category>:<command>` slug (e.g. `git:stage`, `claude:review`).
3. Provision with `./scripts/manage-sandbox.sh <category>:<command>` from `TREE`. The sandbox lands at `$TREE/.sandbox/`.
4. Launch Claude against the sandbox with the worktree's plugin dir and `sonnet`:

   ```bash
   cd $TREE/.sandbox
   claude --plugin-dir $TREE/claude --model sonnet
   ```

5. Do not run `aitk sandbox` from a linked worktree. It resolves to the main repo's scripts and writes to the main repo's `.sandbox/`, hiding uncommitted changes on the worktree branch.
6. Do not launch `claude` without `--plugin-dir $TREE/claude`. The default plugin resolution picks up the installed skills, not the worktree's edits.

Stop if `./scripts/manage-sandbox.sh` does not exist (not a toolkit tree) or the scenario slug does not match a file under `scripts/sandbox/`.
