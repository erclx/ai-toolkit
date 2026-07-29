#!/usr/bin/env bash

# Fixture files carry this suffix so the repository's own checks ignore them.
# A stored `index.md.fixture` is not an `index.md`, so the index walker, prettier,
# shfmt, and shellcheck all skip it and the bytes reach the sandbox unmodified.
FIXTURE_SUFFIX=".fixture"

fixture_stage_dir() {
  local category="$1"
  local arm="$2"
  local stage="$3"
  echo "$PROJECT_ROOT/scripts/sandbox/fixtures/$category/$arm/$stage"
}

list_fixture_files() {
  local source_dir="$1"
  find "$source_dir" -type f -name "*$FIXTURE_SUFFIX" -print0 | sort -z
}

count_fixture_files() {
  local source_dir="$1"
  if [ ! -d "$source_dir" ]; then
    echo 0
    return 0
  fi
  find "$source_dir" -type f -name "*$FIXTURE_SUFFIX" | wc -l
}

# The copy loops match on the suffix, so a file without one would be skipped in
# silence and the scenario would provision a tree it was never meant to have.
assert_fixtures_suffixed() {
  local source_dir="$1"
  [ -d "$source_dir" ] || return 0

  local stray
  stray="$(find "$source_dir" -type f -not -name "*$FIXTURE_SUFFIX" | sort | tr '\n' ' ')"
  [ -z "$stray" ] || log_error "Fixture missing the $FIXTURE_SUFFIX suffix: $stray"
}

fixture_target_path() {
  local source_dir="$1"
  local source_file="$2"
  local relative="${source_file#"$source_dir"/}"
  echo "${relative%"$FIXTURE_SUFFIX"}"
}

create_from_fixtures() {
  local source_dir="$1"
  [ -d "$source_dir" ] || return 0

  local source_file target
  while IFS= read -r -d '' source_file; do
    target="$(fixture_target_path "$source_dir" "$source_file")"
    mkdir -p "$(dirname "$target")"
    cp "$source_file" "$target"
  done < <(list_fixture_files "$source_dir")
}

# An append fixture extends a file the anchor or the injected seeds already
# provide. A missing target means that upstream shape changed, so fail rather
# than create the file and silently alter what the scenario provisions.
append_from_fixtures() {
  local source_dir="$1"
  [ -d "$source_dir" ] || return 0

  local source_file target
  while IFS= read -r -d '' source_file; do
    target="$(fixture_target_path "$source_dir" "$source_file")"
    if [ ! -f "$target" ]; then
      log_error "Append fixture has no target: $target"
    fi
    cat "$source_file" >>"$target"
  done < <(list_fixture_files "$source_dir")
}

# Stages one step of a scenario arm into the sandbox working directory.
# Scenarios call this once per step so their own git operations stay between
# the steps, where they are visible.
stage_fixtures() {
  local category="$1"
  local arm="$2"
  local stage="$3"

  local stage_dir
  stage_dir="$(fixture_stage_dir "$category" "$arm" "$stage")"

  if [ ! -d "$stage_dir" ]; then
    log_error "Fixture stage not found: $category/$arm/$stage"
  fi

  assert_fixtures_suffixed "$stage_dir/create"
  assert_fixtures_suffixed "$stage_dir/append"

  local staged
  staged=$(($(count_fixture_files "$stage_dir/create") + \
  $(count_fixture_files "$stage_dir/append")))
  if [ "$staged" -eq 0 ]; then
    log_error "Fixture stage provisions nothing: $category/$arm/$stage"
  fi

  create_from_fixtures "$stage_dir/create"
  append_from_fixtures "$stage_dir/append"
}
