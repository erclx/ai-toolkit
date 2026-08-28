#!/usr/bin/env bash
set -e
set -o pipefail

source "$PROJECT_ROOT/scripts/lib/sandbox-fixtures.sh"

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
}

stage_setup() {
  select_or_route_scenario "Which scenario?" "installed"

  case "$SELECTED_OPTION" in
  "installed")
    mkdir -p .claude/standards .claude/hooks .claude/rules/project .claude/skills/house-review

    # The two toolkit copies come out of the package rather than out of this
    # repository's own `standards/`. The arm runs against whatever `aitk` is on
    # PATH, and the skill compares each file against that binary's corpus, so a
    # copy taken from here would read as drifted the moment the two diverge and
    # the unchanged branch would never be exercised.
    #
    # The catalog rather than `aitk standards <name>`, which strips frontmatter
    # on its way to stdout while the catalog's `content` carries it. An install
    # copied the source file whole, so the catalog is the field the skill
    # compares against and the one a fixture has to match byte for byte.
    # `jq -j` rather than `-r`, since a trailing newline appended to content
    # that already ends in one is a one-byte drift the arm would score.
    local catalog
    catalog=$(AITK_NON_INTERACTIVE=1 aitk standards list --json 2>/dev/null) || true
    if [ -z "$catalog" ]; then
      log_error "aitk standards list returned nothing. The arm would stage a tree with no toolkit copy in it."
      return 1
    fi

    for standard in slug branch; do
      printf '%s' "$catalog" |
        jq -j --arg name "$standard" '.standards[] | select(.name == $name) | .content' \
          >".claude/standards/$standard.md"
      if [ ! -s ".claude/standards/$standard.md" ]; then
        log_error "The catalog carries no $standard standard. The arm would score a split with nothing to match."
        return 1
      fi
    done

    # The drifted case. One appended line is enough, since the skill compares
    # bytes and reports the file as a read the user owes rather than deciding
    # which side moved.
    printf '\n- Branch names in this project carry the ticket number after the type\n' \
      >>.claude/standards/branch.md

    # The retired name. `prose` resolves as no standard now, so a repoint that
    # maps every old name one to one lands a citation on nothing.
    cat <<'EOF' >.claude/standards/prose.md
---
title: Prose reference
description: Voice and banned words for prose in this repository
---

# Prose reference

## Banned words

- seamless
- robust
- powerful
EOF

    # The project's own standard. Unmatched for the same reason `prose` is, and
    # the skill has to reach the opposite verdict on it, so both are staged.
    cat <<'EOF' >.claude/standards/billing.md
---
title: Billing reference
description: How an invoice, a renewal, and a refund are recorded
---

# Billing reference

## What a renewal records

- The provider's transaction id, on the invoice rather than on the customer
- The retry count, whenever the first attempt timed out
EOF

    # The runtime reader. Not markdown, so the skill separates it from a
    # citation, and it parses the one standard the drop cannot replace by name.
    cat <<'EOF' >.claude/hooks/standards-audit.sh
#!/usr/bin/env bash
# Fails an edit that ships a banned word, reading the list out of the standard.
set -euo pipefail

file="$1"
banned=$(sed -n 's/^- //p' .claude/standards/prose.md)

for word in $banned; do
  if grep -qi "\b$word\b" "$file"; then
    echo "banned word in $file: $word" >&2
    exit 2
  fi
done
EOF
    chmod +x .claude/hooks/standards-audit.sh

    # Three citing surfaces, one per expansion behavior. The skill gives all
    # three the same target and the project-local skill is the one a session
    # gets wrong, since `${CLAUDE_SKILL_DIR}/../../standards/` from
    # `.claude/skills/<name>/` resolves back into the tree being dropped.
    cat <<'EOF' >CLAUDE.md
# Billing service

## Conventions

- Follow `.claude/standards/slug.md` when naming a file after a branch
- Follow `.claude/standards/prose.md` for anything a customer reads
EOF

    cat <<'EOF' >.claude/rules/project/900-house.md
---
description: House naming rules for a branch and its worktree
paths:
  - '**/*.md'
---

# House naming

## Branches

- Read `.claude/standards/branch.md` before renaming a branch
EOF

    cat <<'EOF' >.claude/skills/house-review/SKILL.md
---
name: house-review
description: Reviews a branch against the house conventions. Use when asked to review a branch.
---

# House review

Read `.claude/standards/slug.md` from the project root for the slug transform.

## Steps

1. Derive the slug from the branch name
2. Report every file whose name disagrees with it
EOF

    git add . && git commit -m "chore(sandbox): installed standards tree with its citations and one runtime reader" --no-verify -q

    # The tree is tracked, which is what makes `git rm -r` the correct drop
    # command rather than `rm -rf`. An untracked tree exercises the other
    # branch and the proposal would name the wrong one here.
    if ! git ls-files --error-unmatch .claude/standards/slug.md >/dev/null 2>&1; then
      log_error "The standards tree is not tracked. The arm would score the untracked drop command instead."
      return 1
    fi

    # The skill stops on a binary behind the published version, because the sync
    # it proposes installs the rules that binary carries. An arm run against a
    # stale install would score that refusal rather than the proposal declared
    # below. Captured whole rather than piped, since `pipefail` turns a matcher's
    # early exit into a SIGPIPE the guard would read as a missing field.
    local report
    report=$(AITK_NON_INTERACTIVE=1 aitk sync --check . --json 2>/dev/null) || true

    case "$report" in
    *'"state":"behind"'* | *'"state": "behind"'*)
      log_error "The aitk on PATH is behind the published version. Update it, or the arm scores the skew refusal."
      return 1
      ;;
    esac

    log_step "Scenario ready: migration-standards-drop on a target holding an installed standards tree"
    log_info "Context: .claude/standards/ holds 4 files across the three verdicts"
    log_info "  slug.md is the package copy unchanged, branch.md carries one appended line"
    log_info "  prose.md names a standard that no longer resolves, billing.md is the project's own"
    log_info "  .claude/hooks/standards-audit.sh parses prose.md at run time rather than citing it"
    log_info "  CLAUDE.md, a project rule, and a project-local skill each cite the tree"
    log_info "Action:  /aitk:migration-standards-drop"
    log_info "Expect:  splits the tree three ways, names the reader ahead of the drop, gives every"
    log_info "         citation aitk standards <name>, orders sync then drop then sweep, writes nothing"
    log_info "Assert:  declared in fixtures/claude/migration-standards-drop/installed/expect.toml"
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
