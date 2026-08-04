#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/worktree.sh"

NESTED="${VERIFY_NESTED:-false}"
WRITE="${VERIFY_WRITE:-true}"
SCOPED=true
CHANGED_FILES=""

check_dependencies() {
  command -v bun >/dev/null 2>&1 || log_error "bun is not installed"
}

print_usage() {
  echo "Usage: bun run check [--all]"
  echo "  --all   Run every stage instead of scoping shell, types, and tests to changed files"
  echo "  --help  Print this message"
}

parse_args() {
  local arg
  for arg in "$@"; do
    case "$arg" in
    --all) SCOPED=false ;;
    -h | --help)
      print_usage
      exit 0
      ;;
    *) log_error "Unknown argument: $arg" ;;
    esac
  done
}

# Union of the branch's committed diff, the working tree, and untracked files.
# A wider set only means running more stages, so every fallback widens.
collect_changed_files() {
  [ "$SCOPED" = true ] || return 0

  local base head local_baseline=false
  # origin/main, not local main. On main itself the local ref is HEAD, so a commit
  # not yet pushed would drop out of the changed set and skip the scoped stages.
  base=$(git -C "$PROJECT_ROOT" merge-base HEAD origin/main 2>/dev/null) || base=""
  if [ -z "$base" ]; then
    local_baseline=true
    base=$(git -C "$PROJECT_ROOT" merge-base HEAD main 2>/dev/null) || base=""
  fi
  if [ -z "$base" ]; then
    SCOPED=false
    log_warn "No merge base with main. Running every stage."
    return 0
  fi

  # Without a remote baseline, a merge base equal to HEAD hides committed work.
  if [ "$local_baseline" = true ]; then
    head=$(git -C "$PROJECT_ROOT" rev-parse HEAD 2>/dev/null) || head=""
    if [ -z "$head" ] || [ "$base" = "$head" ]; then
      SCOPED=false
      log_warn "No pushed baseline to compare against. Running every stage."
      return 0
    fi
  fi

  CHANGED_FILES=$({
    git -C "$PROJECT_ROOT" diff --name-only "$base" HEAD
    git -C "$PROJECT_ROOT" diff --name-only HEAD
    git -C "$PROJECT_ROOT" ls-files --others --exclude-standard
  } | sort -u)
}

has_changed() {
  [ "$SCOPED" = true ] || return 0
  printf '%s\n' "$CHANGED_FILES" | grep -qE "$1"
}

run_check() {
  local cmd=$1
  local err_msg=$2
  local output
  if ! output=$(eval "$cmd" 2>&1); then
    echo "$output" | pipe_output
    log_error "$err_msg"
  fi
  echo "$output" | pipe_output
}

# Whatever plugin and marketplace manifests the repo currently carries, so the
# stage picks up a new one without an edit here. Both listings honor .gitignore,
# which keeps linked worktrees and dependency copies out.
collect_plugin_manifests() {
  {
    git -C "$PROJECT_ROOT" ls-files -- '*.claude-plugin/plugin.json' '*.claude-plugin/marketplace.json'
    git -C "$PROJECT_ROOT" ls-files --others --exclude-standard -- '*.claude-plugin/plugin.json' '*.claude-plugin/marketplace.json'
  } | sort -u
}

# The drift assert covers the HTML because the PNG is a chromium render whose
# bytes move with the browser. That leaves the artifact a visitor actually sees
# asserted nowhere, so a branch that regenerates the HTML and never runs the
# capture passes every stage while shipping an image with the old counts.
#
# The two files move together or the image is stale, so their last-touching
# commit is the same commit. Comparing the branch's file list instead would pass
# any branch that touched both anywhere, including one that regenerated the HTML
# alone in a later commit. Both absent resolves to two empty strings and passes,
# which is correct for a tree that carries neither.
assert_hero_pair() {
  local html_commit png_commit
  html_commit=$(git -C "$PROJECT_ROOT" log -1 --format=%H -- assets/hero.html)
  png_commit=$(git -C "$PROJECT_ROOT" log -1 --format=%H -- assets/hero.png)
  [ "$html_commit" = "$png_commit" ]
}

# Whatever stacks the repo currently carries, so a new one is covered without an
# edit here. A seed root holding no `.claude/` seeds nothing a standard governs.
collect_seed_roots() {
  local dir
  for dir in "$PROJECT_ROOT"/tooling/*/seeds; do
    [ -d "$dir/.claude" ] || continue
    printf '%s\n' "${dir#"$PROJECT_ROOT"/}"
  done
}

# Entries the audit actually measured, summed across the folders it resolved.
# `--json` carries one `"entries":<n>` per folder object, and the top-level key
# of that name holds an array, so the numeric match reaches folders alone.
#
# A root can resolve a folder and measure nothing in it, which is a passing gate
# over an empty set. The stage prints this per root rather than reporting one
# verdict for every root, or a tree nobody measured reads as a tree that passed.
seed_entry_count() {
  printf '%s' "$1" | grep -o '"entries":[0-9]\+' | grep -o '[0-9]\+' |
    awk '{ total += $1 } END { print total + 0 }'
}

assert_no_drift() {
  local paths=$1
  local err_msg=$2
  run_check "cd $PROJECT_ROOT && git diff --exit-code --quiet -- $paths" "$err_msg"
  run_check "cd $PROJECT_ROOT && [ -z \"\$(git ls-files --others --exclude-standard -- $paths)\" ]" "$err_msg"
}

main() {
  check_dependencies
  parse_args "$@"

  if [ "$NESTED" = false ]; then echo -e "${GREY}┌${NC}"; fi

  repair_bare_flag
  collect_changed_files

  if [ "$WRITE" = true ]; then
    echo -e "${GREY}├${NC} ${WHITE}Formatting${NC}"
    run_check "bun run format" "Format failed"
    log_info "Format applied"
  else
    echo -e "${GREY}├${NC} ${WHITE}Format check${NC}"
    run_check "bun run check:format" "Format check failed"
    log_info "Format check passed"
  fi

  log_step "Indexes"
  run_check "bash $PROJECT_ROOT/scripts/core/regen-indexes.sh" "Index regen failed"
  assert_no_drift "'*index.md'" "Indexes drifted. Run bun run check and commit the updated index files."
  log_info "Indexes clean"

  log_step "Consumed copies"
  run_check "bash $PROJECT_ROOT/scripts/core/regen-claude-copies.sh" "Consumed-copy regen failed"
  assert_no_drift ".claude/standards .claude/snippets .claude/internal .claude/rules" "Consumed copies drifted. Run bun run check and commit .claude/standards, .claude/snippets, .claude/internal, and .claude/rules."
  log_info "Consumed copies clean"

  # Only the HTML is asserted. The PNG beside it is a chromium render whose bytes
  # move with the browser version, so a drift check over it would fail on a
  # machine whose chromium differs rather than on a stale count.
  log_step "Hero"
  run_check "bash $PROJECT_ROOT/scripts/core/regen-hero.sh" "Hero regen failed"
  assert_no_drift "assets/hero.html" "Hero counts drifted. Run bun run check, then aitk capture assets/hero.html, and commit assets/hero.html with assets/hero.png."
  run_check "assert_hero_pair" "Hero HTML and image last moved in different commits, so the image may be stale. Run aitk capture assets/hero.html and commit both files together."
  log_info "Hero clean"

  log_step "Skill references"
  run_check "bash $PROJECT_ROOT/scripts/core/regen-skill-references.sh" "Skill-reference regen failed"
  assert_no_drift "claude/skills/*/references" "Skill references drifted. Run bun run check and commit the updated reference files."
  log_info "Skill references clean"

  log_step "Skill paths"
  run_check "bash $PROJECT_ROOT/scripts/core/check-skill-paths.sh" "Shipped skills reference a repo-local path."
  log_info "Skill paths clean"

  log_step "Plugin boundary"
  run_check "bash $PROJECT_ROOT/scripts/core/check-plugin-boundary.sh" "Plugin ships toolkit-internal content."
  log_info "Plugin boundary clean"

  # Only the citation half of the audit gates. Length, depth, table, and index
  # findings are judgment thresholds, and failing a push on one would make the
  # stage something to route around. `bun src/cli.ts` rather than `aitk`, since a
  # globally installed binary resolves to the main checkout no matter which
  # worktree is running.
  log_step "Context citations"
  run_check "cd $PROJECT_ROOT && bun src/cli.ts context audit --citations-only" "A cited context path does not resolve. Run bun src/cli.ts context audit."
  log_info "Context citations resolve"

  # The stage above audits this repository. Its seed tree ships into every
  # scaffolded project, so a seed breaking the standard it seeds propagates
  # instead of sitting still, and no rule path reaches the tree to report it.
  # `--gate` fails on the two findings beside citations that are facts, a
  # missing required section and index drift, and leaves the thresholds
  # advisory for the reason the stage above leaves them so. A passing run stays
  # silent because the audit prints a frame that would nest inside this one.
  log_step "Seed standards"
  local seed_roots seed_root seed_output seed_frame seed_entries seed_measured seed_status
  seed_roots=$(collect_seed_roots)
  if [ -z "$seed_roots" ]; then
    log_info "Skipped, no seed root carries .claude/"
  else
    seed_measured=0
    while IFS= read -r seed_root; do
      # `--json` puts the record on stdout and the frame on stderr, so the
      # passing run stays silent and the failing one is re-run for its frame
      # rather than parsed out of a stream this script would have to strip.
      seed_status=0
      seed_output=$(cd "$PROJECT_ROOT" && bun src/cli.ts context audit "$seed_root" --gate --json 2>/dev/null) || seed_status=$?

      # The audit separates 1 from 2 and they mean opposite things. 2 is a seed
      # breaking the standard it seeds. 1 is the audit refusing, which a seed
      # root carrying no audited folder produces, and reporting that as a
      # violation sends a reader hunting one that does not exist. Discovery is
      # what puts this in reach, since a new stack seeding `.claude/` alone
      # arrives here with no edit to this script.
      case $seed_status in
      0) ;;
      1)
        log_warn "$seed_root: no audited folder under .claude/, nothing measured"
        continue
        ;;
      *)
        # `|| true` because the re-run exits non-zero by construction, and
        # `set -e` would take the script down before log_error names the root.
        seed_frame=$(cd "$PROJECT_ROOT" && bun src/cli.ts context audit "$seed_root" --gate 2>&1 || true)
        echo "$seed_frame" | pipe_output
        if [ "$seed_status" -eq 2 ]; then
          log_error "A seed breaks the standard governing the folder it seeds: $seed_root"
        else
          log_error "The seed audit exited $seed_status against $seed_root, which is neither a pass nor a finding."
        fi
        ;;
      esac

      seed_entries=$(seed_entry_count "$seed_output")
      seed_measured=$((seed_measured + seed_entries))

      if [ "$seed_entries" -eq 0 ]; then
        log_warn "$seed_root: no entry under an audited folder, nothing measured"
      else
        log_info "$seed_root: $seed_entries entries measured"
      fi
    done <<<"$seed_roots"

    if [ "$seed_measured" -eq 0 ]; then
      log_warn "No seed entry was measured. The stage covered nothing."
    fi
  fi

  # Presence of a required file is a fact, so it gates. The name, description,
  # folder, and requirement-section measures beside it report and are read from a
  # bare run. `bun src/cli.ts` for the reason the stage above uses it, and the
  # command reads the cwd, so this measures the worktree being pushed.
  log_step "Skill requirements"
  run_check "cd $PROJECT_ROOT && bun src/cli.ts claude skills audit --requirements-only" "A skill folder carries no REQUIREMENT.md. Run bun src/cli.ts claude skills audit."
  log_info "Skill requirements present"

  log_step "Plugin manifests"
  if ! command -v claude >/dev/null 2>&1; then
    log_info "Skipped, claude is not installed"
  else
    local manifests manifest
    manifests=$(collect_plugin_manifests)
    if [ -z "$manifests" ]; then
      log_info "Skipped, no manifests present"
    else
      while IFS= read -r manifest; do
        run_check "cd $PROJECT_ROOT && claude plugin validate --strict '$manifest'" "Manifest validation failed: $manifest"
      done <<<"$manifests"
      log_info "Manifests valid"
    fi
  fi

  log_step "Spelling"
  run_check "bun run check:spell" "Spell check failed"
  log_info "Spell check passed"

  log_step "Shell"
  if has_changed '\.sh$|^package\.json$'; then
    run_check "bun run check:shell" "Shell check failed"
    log_info "Shell check passed"
  else
    log_info "Skipped, no shell changes"
  fi

  log_step "Types"
  if has_changed '^src/|^tsconfig\.json$|^package\.json$'; then
    run_check "bun run check:types" "Typecheck failed"
    log_info "Typecheck passed"
  else
    log_info "Skipped, no TypeScript changes"
  fi

  log_step "Tests"
  if has_changed '^src/|^vitest\.config\.ts$|^tsconfig\.json$|^package\.json$'; then
    run_check "bun run test" "Tests failed"
    log_info "Tests passed"
  else
    log_info "Skipped, no TypeScript changes"
  fi

  if [ "$NESTED" = false ]; then
    echo -e "${GREY}└${NC}\n"
    echo -e "${GREEN}✓ Verification passed${NC}"
  fi
}

main "$@"
