#!/bin/bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

stage_setup() {
  cat <<'EOF' >CLAUDE.md
# Sample Project

Fixture target project for /toolkit:toolkit-feedback. Pretend this project has the ai/toolkit installed via plugin and snippets.

## Commands

- `bun run check`: lint and typecheck
EOF

  mkdir -p .claude
  cat <<'EOF' >.claude/SCENARIO.md
# Scenario

You are in a target project that consumes the ai/toolkit. You just tried to run the `claude-review` plugin skill and it skipped reading `.claude/GOV.md` even though the file exists.

When you invoke `/toolkit-feedback`, describe what you observed in one or two sentences before invoking, so the skill has session context to extract from.

Example opener to paste before invoking:

> I ran /claude-review on the current branch. It pulled CLAUDE.md and REQUIREMENTS.md but never surfaced anything from .claude/GOV.md, which has a rule about named exports. Expected it to apply GOV rules to the diff.
EOF

  mkdir -p .claude/plugins
  cat <<'EOF' >.claude/plugins/toolkit-version.txt
main@abc1234
EOF

  git add . && git commit -m "chore(sandbox): initial toolkit-feedback fixture" --no-verify -q

  log_step "Scenario ready: toolkit feedback"
  log_info "Context: target project with CLAUDE.md plus .claude/SCENARIO.md describing the pretend issue"
  log_info "Action:  paste the scenario opener into chat, then invoke /toolkit-feedback"
  log_info "Expect:  single fenced block with From project, Surface, Observed, Expected, Repro, Proposed fix"
}
