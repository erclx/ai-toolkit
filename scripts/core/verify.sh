#!/usr/bin/env bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

source "$PROJECT_ROOT/scripts/lib/ui.sh"
source "$PROJECT_ROOT/scripts/lib/worktree.sh"
source "$PROJECT_ROOT/scripts/lib/tooling.sh"

NESTED="${VERIFY_NESTED:-false}"
WRITE="${VERIFY_WRITE:-true}"
SCOPED=true
CHANGED_FILES=""

# Scenarios declaring no expectation, taken from `aitk sandbox coverage` against a
# clean tree. Raising it is a deliberate edit that says which scenario shipped
# unarmed and why.
SANDBOX_UNDECLARED_CEILING=47

# Rules no stack reaches, space separated and sorted the way `aitk gov list`
# emits them. Both are opt-in libraries a project may not want, so they are
# recorded here rather than in a config file: the list is what a reader compares
# a new arrival against, and a config file would absorb the arrival silently.
GOV_EXPECTED_UNREFERENCED="260-shadcn 320-tanstack-query"

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

# One numeric summary key out of a coverage report. The per-scenario objects carry
# neither key this is called with, so the match reaches the top level alone and
# the caller does not depend on the order the keys are emitted in.
sandbox_summary_field() {
  printf '%s' "$2" | grep -o "\"$1\":[0-9]\+" | grep -o '[0-9]\+'
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

  # Seed prose is installed into every scaffolded project and read there as
  # instruction about that project, so a line naming this repository's CLI hands
  # a target a verb it may not be able to run. This gates for the reason the
  # Seed standards stage below gates: a defect authored once propagates into
  # every project scaffolded after it.
  log_step "Seed independence"
  run_check "bash $PROJECT_ROOT/scripts/core/check-seed-independence.sh" "Seed prose cites the toolkit CLI."
  log_info "Seed prose cites no toolkit CLI"

  # A stack entry naming a rule folder takes every rule in it, which is what
  # stops a new rule from needing a second edit to reach a target. The failure
  # it leaves open is a rule authored into a folder no stack names, which
  # installs for nobody and reports nothing on its own.
  #
  # This reports and never fails. Both standing findings are opt-in libraries
  # this repository ships on purpose, so gating would fail every push over the
  # deliberate case and teach a reader to route around the stage. Revisit when a
  # third appears and the pattern is either a library set or an accident.
  log_step "Unreferenced rules"
  local gov_json gov_status=0 unreferenced
  gov_json=$(cd "$PROJECT_ROOT" && bun src/cli.ts gov list --json 2>/dev/null) || gov_status=$?
  if [ "$gov_status" -ne 0 ] || [ -z "$gov_json" ]; then
    log_warn "Skipped, the governance catalog did not report"
  else
    # `bun --eval` rather than a grep, because the key holds an array of names
    # and the numeric matches the stages above use reach a scalar alone.
    #
    # The `ok:` sentinel carries success rather than the exit code, because
    # `bun --eval` reading piped stdin exits 0 even when the script throws.
    # Measured on Bun 1.3.14: the same throw exits 1 with no pipe attached. A
    # payload that parses as text but not as JSON would therefore print nothing
    # and exit clean, and empty already means every rule is reached, so reading
    # the exit code would report a broken catalog as a clean sweep. A missing
    # or non-array key takes the same branch, since a stage that cannot measure
    # should say so rather than claim the sweep found nothing.
    local reported
    reported=$(printf '%s' "$gov_json" | bun --eval '
      try {
        const data = JSON.parse(require("node:fs").readFileSync(0, "utf8"))
        if (!Array.isArray(data.unreferenced)) throw new Error("no field")
        console.log("ok:" + data.unreferenced.join(" "))
      } catch {
        console.log("unreadable:")
      }
    ')
    unreferenced="${reported#ok:}"
    if [ "${reported%%:*}" != "ok" ]; then
      log_warn "Skipped, the governance catalog carried no readable unreferenced list"
    elif [ -z "$unreferenced" ]; then
      log_info "Every rule is reached by a stack"
    elif [ "$unreferenced" = "$GOV_EXPECTED_UNREFERENCED" ]; then
      log_info "Reached by no stack: $unreferenced (opt-in, install with --add)"
    else
      log_warn "Reached by no stack: $unreferenced"
      log_warn "Expected: $GOV_EXPECTED_UNREFERENCED. Name the new rule in a stack, or update GOV_EXPECTED_UNREFERENCED in this script and say why it ships opt-in."
    fi
  fi

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

  # `aitk sandbox coverage` moves only when a person runs it, so a scenario added
  # with no expectation ships unnoticed. The gate is an absolute count of
  # undeclared scenarios rather than a ratio or a floor under the declared count.
  # A floor under the declared count passes the case this exists to catch, since
  # adding an unarmed scenario leaves that number where it was. A ratio moves
  # when a scenario is legitimately deleted, and this ceiling does not: deleting
  # an unarmed scenario lowers it and deleting an armed one leaves it alone.
  log_step "Sandbox coverage"
  local coverage_output coverage_status=0 total armed undeclared
  coverage_output=$(cd "$PROJECT_ROOT" && bun src/cli.ts sandbox coverage --json 2>/dev/null) || coverage_status=$?
  if [ "$coverage_status" -ne 0 ]; then
    if [ "${CI:-false}" = true ]; then
      log_error "bun src/cli.ts sandbox coverage --json exited $coverage_status. The scenario tree ships in the checkout, so a run that does not report is a broken command rather than an absent tree, and skipping would report the pass this stage exists to withhold."
    fi
    log_warn "Skipped, the scenario tree did not report"
  else
    # `|| x=""` on both, because a grep that matches nothing exits non-zero and
    # errexit would take the script down at the assignment, before the guard
    # below could name what went missing.
    total=$(sandbox_summary_field totalScenarios "$coverage_output") || total=""
    armed=$(sandbox_summary_field armedScenarios "$coverage_output") || armed=""
    if [ -z "$total" ] || [ -z "$armed" ]; then
      log_error "The coverage report carried no scenario totals, so the stage measured nothing. Run bun src/cli.ts sandbox coverage --json."
    fi
    undeclared=$((total - armed))
    if [ "$undeclared" -gt "$SANDBOX_UNDECLARED_CEILING" ]; then
      log_error "$undeclared of $total scenarios declare no expectation, over the ceiling of $SANDBOX_UNDECLARED_CEILING. Declare expectations on the new scenario, or raise SANDBOX_UNDECLARED_CEILING in this script and say which scenario shipped unarmed."
    fi
    log_info "$armed of $total scenarios declare expectations, $undeclared undeclared against a ceiling of $SANDBOX_UNDECLARED_CEILING"
  fi

  # The plugin is the second delivery path and this is the only stage gating it,
  # so the skip below is for a contributor's machine rather than for the merge
  # gate. A runner installs the CLI as a workflow step, which makes an absent
  # binary there a broken workflow, and skipping would report a pass for every
  # manifest on the way to a marketplace install.
  log_step "Plugin manifests"
  if ! command -v claude >/dev/null 2>&1; then
    if [ "${CI:-false}" = true ]; then
      log_error "claude is not installed. CI installs it before this stage, so read the Install Plugin CLI step in .github/workflows/verify.yml."
    fi
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
