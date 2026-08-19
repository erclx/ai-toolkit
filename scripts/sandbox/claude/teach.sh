#!/usr/bin/env bash
set -e
set -o pipefail

use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"
  export SANDBOX_INJECT_SEEDS="true"
}

seed_project() {
  cat <<'EOF' >package.json
{
  "name": "sandbox-teach",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
EOF

  mkdir -p src
  cat <<'EOF' >src/index.ts
export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
EOF
}

# Stubbed rather than left empty. The sandbox has no network, so the skill's
# research step cannot run, and an absent resources file would make every arm
# fail on the one behavior the scenario cannot exercise.
seed_workspace() {
  local dir="$1"

  mkdir -p "$dir/reference" "$dir/learning-records" "$dir/lessons" "$dir/assets"

  cat <<'EOF' >"$dir/MISSION.md"
---
title: Regular expressions
description: Reading and writing regular expressions, up to catastrophic backtracking
date: 2026-08-10
---

# Regular expressions

Reading and writing regular expressions well enough to review someone else's.

## Starting point

Comfortable with character classes, anchors, and simple quantifiers. Has never
written a capture group by hand and has not met backtracking.

## Success looks like

- Read a regular expression aloud as a sentence describing what it matches
- Write a capture group and name what each group captures
- Spot a nested quantifier that can backtrack catastrophically
- Rewrite a vulnerable pattern so it cannot backtrack

## Out of scope

- Regular expression engines other than the one in JavaScript
- Lookbehind, which the target engine supports unevenly
EOF

  cat <<'EOF' >"$dir/RESOURCES.md"
---
title: Resources
description: Sources behind the regular expression material, and what was found and not opened
---

# Resources

## Read

- The language specification section on pattern semantics, read 2026-08-10

## Leads

- A book chapter on backtracking engines, found and not opened
EOF

  cat <<'EOF' >"$dir/GLOSSARY.md"
---
title: Glossary
description: Terms the regular expression material defines
---

# Glossary

- **Anchor**: a token matching a position rather than a character. First appears
  in `0001-reading-patterns`.
- **Quantifier**: a token stating how many times the thing before it may repeat.
  First appears in `0001-reading-patterns`.
EOF

  cat <<'EOF' >"$dir/learning-records/0001-reading-patterns.md"
---
title: First pass on reading patterns
description: What the learner retrieved unaided and what they got wrong
---

# First pass on reading patterns

## Covered

- Lesson `0001-reading-patterns`

## Retrieved unaided

- Named what `^` and `$` match
- Read a character class aloud correctly

## Wrong

- Asked what `a+?` matches, answered "one or more a, then a literal question
  mark". The lazy quantifier was read as a separate token.
- Asked what `(ab)*` captures after three repeats, answered "ab ab ab". Only the
  last repetition is captured.

## Revisit

- Lazy quantifiers, next session
- Capture group semantics, within a week
EOF

  cat <<'EOF' >"$dir/reference/reading-patterns.md"
---
title: Reading a pattern aloud
description: Turning a regular expression into a sentence, token by token
---

# Reading a pattern aloud

A pattern reads left to right as a sequence of claims about the text.

## Anchors

`^` claims the position at the start of the input. `$` claims the position at
the end. Neither consumes a character.
EOF

  cat <<'EOF' >"$dir/lessons/0001-reading-patterns.html"
<article><h1>Reading a pattern aloud</h1><p>Generated lesson body.</p></article>
EOF

  cat <<'EOF' >"$dir/assets/course.css"
body { font-family: system-ui; line-height: 1.6; max-width: 68ch; }
EOF
}

stage_setup() {
  log_step "Teach sandbox"
  log_info "open   : no workspace folder yet, one has to be opened from nothing"
  log_info "resume : a live workspace at 01-regex with one record carrying two wrong answers"
  log_info ""
  log_info "Invoke the prefixed form. The dev-skill injection copies SKILL.md alone,"
  log_info "so the unprefixed copy cannot resolve the bundled standards/teach.md."
  log_info "Launch with: claude --plugin-dir <worktree-root>/claude --model sonnet"

  select_or_route_scenario "Which scenario?" "open" "resume"

  case "$SELECTED_OPTION" in
  "open")
    seed_project

    mkdir -p .claude/teach

    git add . && git commit -m "feat(cli): slugify helper" --no-verify -q

    log_step "Scenario ready: teach opens the first workspace"
    log_info "Context: .claude/teach/ exists and holds no workspace"
    log_info "  The invocation carries the starting point, because the skill"
    log_info "  settles it by asking and a headless run has nobody to answer."
    log_info "  A prompt without it leaves the session waiting and writing nothing,"
    log_info "  which is correct behavior and asserts none of the workspace shape."
    log_info ""
    log_info "Action:  /aitk:claude-teach regex, and I know character classes and"
    log_info "         anchors but have never written a capture group"
    log_info "Expect:  declared in fixtures/claude/teach/open/expect.toml"
    log_info "         Check it with: aitk sandbox check claude:teach open"
    log_info "         A folder at .claude/teach/01-regex/ carrying MISSION.md"
    log_info "         with a date and a success list, RESOURCES.md, and"
    log_info "         GLOSSARY.md. Nothing written outside .claude/teach/."
    log_info "         The session asks what the learner already knows."
    ;;
  "resume")
    seed_project
    seed_workspace ".claude/teach/01-regex"

    git add . && git commit -m "feat(cli): slugify helper" --no-verify -q

    log_step "Scenario ready: teach resumes a live workspace"
    log_info "Context: .claude/teach/01-regex/ holds a mission, resources, a glossary,"
    log_info "  one reference page, one lesson, and one learning record"
    log_info "  That record names two wrong answers: a lazy quantifier read as two"
    log_info "  tokens, and a capture group believed to hold every repetition"
    log_info "  The mission carries four success lines and one is already met"
    log_info ""
    log_info "Action:  /aitk:claude-teach regex"
    log_info "Expect:  declared in fixtures/claude/teach/resume/expect.toml"
    log_info "         Check it with: aitk sandbox check claude:teach resume"
    log_info "         Resume detected from the folder rather than asked about."
    log_info "         The next lesson opens on the two recorded wrong answers"
    log_info "         before anything new, and lands at 0002 in both lessons/"
    log_info "         and learning-records/. No second workspace is opened."
    ;;
  *)
    log_error "Unknown scenario: $SELECTED_OPTION"
    ;;
  esac
}
