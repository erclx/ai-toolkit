#!/bin/bash

inject_governance() {
  log_step "Injecting Governance Assets"

  local rules_source="$PROJECT_ROOT/.cursor/rules"
  local rules_target=".cursor/rules"
  local standards_source="$PROJECT_ROOT/standards"
  local standards_target="standards"

  if [ -d "$rules_source" ]; then
    mkdir -p "$rules_target"
    find "$rules_source" -type f -name "*.mdc" -exec cp {} "$rules_target/" \;
    shopt -s nullglob
    for f in "$rules_target"/*.mdc; do
      log_info "Injected Rule: .cursor/rules/$(basename "$f")"
    done
    shopt -u nullglob
  else
    log_warn "Source rules not found at $rules_source. Skipping injection."
  fi

  if [ -d "$standards_source" ]; then
    mkdir -p "$standards_target"
    cp -r "$standards_source/." "$standards_target/"
    shopt -s nullglob
    for f in "$standards_target"/*.md; do
      log_info "Injected Standard:  standards/$(basename "$f")"
    done
    shopt -u nullglob
  else
    log_warn "Source docs not found at $standards_source. Skipping injection."
  fi
}

inject_tooling_configs() {
  local stack_name="$1"
  local target_path="${2:-.}"
  local tooling_dir="$PROJECT_ROOT/tooling"
  local manifest="$tooling_dir/$stack_name/manifest.toml"

  if [ ! -f "$manifest" ]; then
    log_warn "Manifest not found: $manifest"
    return
  fi

  local extends
  extends=$(grep '^extends' "$manifest" | cut -d'"' -f2)

  if [ -n "$extends" ]; then
    inject_tooling_configs "$extends" "$target_path"
  fi

  local configs_dir="$tooling_dir/$stack_name/configs"
  if [ ! -d "$configs_dir" ]; then
    return
  fi

  log_info "Applying $stack_name configs to $target_path"

  while IFS= read -r file; do
    local rel="${file#"$configs_dir"/}"
    local dest="$target_path/$rel"
    local dest_dir
    dest_dir=$(dirname "$dest")

    if [ "$dest_dir" != "." ]; then
      mkdir -p "$dest_dir"
    fi

    cp "$file" "$dest"
    log_info "  $rel"
  done < <(find "$configs_dir" -type f | sort)
}

inject_tooling_seeds() {
  local stack_name="$1"
  local target_path="${2:-.}"
  local tooling_dir="$PROJECT_ROOT/tooling"
  local manifest="$tooling_dir/$stack_name/manifest.toml"

  if [ ! -f "$manifest" ]; then
    return
  fi

  local extends
  extends=$(grep '^extends' "$manifest" | cut -d'"' -f2)

  if [ -n "$extends" ]; then
    inject_tooling_seeds "$extends" "$target_path"
  fi

  local seeds_dir="$tooling_dir/$stack_name/seeds"
  if [ ! -d "$seeds_dir" ]; then
    return
  fi

  while IFS= read -r file; do
    local rel="${file#"$seeds_dir"/}"
    local dest="$target_path/$rel"
    local dest_dir
    dest_dir=$(dirname "$dest")

    if [ ! -f "$dest" ]; then
      mkdir -p "$dest_dir"
      cp "$file" "$dest"
      log_info "  $rel"
    fi
  done < <(find "$seeds_dir" -type f | sort)
}

inject_tooling_manifest() {
  local stack_name="$1"
  local target_path="${2:-.}"
  local manifest="$PROJECT_ROOT/tooling/$stack_name/manifest.toml"

  [ ! -f "$manifest" ] && return

  local extends
  extends=$(grep '^extends' "$manifest" | cut -d'"' -f2)
  [ -n "$extends" ] && inject_tooling_manifest "$extends" "$target_path"

  read -r -a deps_array <<<"$(awk '/packages = \[/{f=1; next} /\]/{f=0} f' "$manifest" | tr -d '",' | tr '\n' ' ')"

  if [ ${#deps_array[@]} -gt 0 ]; then
    log_info "Installing $stack_name dev dependencies in $target_path"
    (cd "$target_path" && bun add -D "${deps_array[@]}")
  fi

  local scripts
  scripts=$(awk '/^\[scripts\]/{f=1; next} /^\[/{f=0} f' "$manifest")

  if [ -n "$scripts" ] && [ -f "$target_path/package.json" ]; then
    (cd "$target_path" && node -e "
        const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('package.json'));
      pkg.scripts = pkg.scripts || {};
      process.argv[1].split('\n').forEach(line => {
        const m = line.match(/^\s*\"([^\"]+)\"\s*=\s*\"(.*)\"\s*$/);
        if (m) pkg.scripts[m[1]] = m[2];
      });
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    " "$scripts")
    log_info "Applied $stack_name package scripts"
  fi
}

inject_dependencies() {
  log_step "Provisioning Dependencies"

  if [ -f "package.json" ]; then
    if command -v bun &>/dev/null; then
      log_info "Detected Node project. Running bun install..."
      bun install
      log_info "Dependencies installed"
    else
      log_warn "package.json found but bun missing"
    fi
  elif [ -f "pyproject.toml" ] || [ -f "uv.lock" ]; then
    if command -v uv &>/dev/null; then
      log_info "Detected Python project. Running uv sync..."
      uv sync
      log_info "Dependencies synced"
    else
      log_warn "Python manifest found but uv missing"
    fi
  else
    log_info "No manifest detected. Skipping install."
  fi

  echo -e "${GREY}│${NC}"
}
