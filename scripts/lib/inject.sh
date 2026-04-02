#!/bin/bash

inject_governance() {
  log_step "Injecting governance assets"

  local rules_source="$PROJECT_ROOT/governance/rules"
  local rules_target=".cursor/rules"
  local standards_source="$PROJECT_ROOT/standards"
  local standards_target="standards"

  if [ -d "$rules_source" ]; then
    mkdir -p "$rules_target"
    find "$rules_source" -type f -name "*.mdc" -exec cp {} "$rules_target/" \;
    shopt -s nullglob
    for f in "$rules_target"/*.mdc; do
      log_add ".cursor/rules/$(basename "$f")"
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
      log_add "standards/$(basename "$f")"
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

  log_step "Applying $stack_name configs"

  while IFS= read -r file; do
    local rel="${file#"$configs_dir"/}"
    local dest="$target_path/$rel"
    local dest_dir
    dest_dir=$(dirname "$dest")

    if [ "$dest_dir" != "." ]; then
      mkdir -p "$dest_dir"
    fi

    cp "$file" "$dest"
    log_add "$rel"
  done < <(find "$configs_dir" -type f | sort)
}

merge_seed_file() {
  local src="$1"
  local dest="$2"

  local dest_dir
  dest_dir=$(dirname "$dest")
  mkdir -p "$dest_dir"

  if [ ! -f "$dest" ]; then
    cp "$src" "$dest"
    return
  fi

  local added=0
  while IFS= read -r word; do
    [ -z "$word" ] && continue
    if ! grep -qxF -- "$word" "$dest"; then
      echo "$word" >>"$dest"
      added=$((added + 1))
    fi
  done <"$src"

  if [ "$added" -gt 0 ]; then
    sort -o "$dest" "$dest"
  fi
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
  [ ! -d "$seeds_dir" ] && return

  log_step "Applying $stack_name seeds"
  while IFS= read -r file; do
    local rel="${file#"$seeds_dir"/}"
    local dest="$target_path/$rel"
    [ -f "$dest" ] && continue
    merge_seed_file "$file" "$dest"
    log_add "$rel"
  done < <(find "$seeds_dir" -type f | sort)
}

inject_tooling_reference() {
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
    inject_tooling_reference "$extends" "$target_path"
  fi

  local reference_file="$tooling_dir/$stack_name/reference.md"
  [ ! -f "$reference_file" ] && return

  local dest_dir="$target_path/tooling"
  mkdir -p "$dest_dir"
  log_step "Applying $stack_name reference"
  cp "$reference_file" "$dest_dir/$stack_name.md"
  log_add "tooling/$stack_name.md"
}

merge_gitignore() {
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
    merge_gitignore "$extends" "$target_path"
  fi

  local gitignore="$target_path/.gitignore"
  touch "$gitignore"

  local in_section=0
  local current_header=""
  local current_entries=()
  local has_logged=0

  while IFS= read -r line; do
    if [[ "$line" =~ ^\[gitignore\] ]]; then
      in_section=1
      continue
    fi

    if [[ "$in_section" -eq 1 && "$line" =~ ^\[.+\] ]]; then
      break
    fi

    [ "$in_section" -eq 0 ] && continue
    [ -z "$line" ] && continue

    if [[ "$line" =~ ^\"(#[^\"]+)\"[[:space:]]*=[[:space:]]*\[(.*)$ ]]; then
      current_header="${BASH_REMATCH[1]}"
      current_entries=()
      local rest="${BASH_REMATCH[2]}"

      if [[ "$rest" =~ \] ]]; then
        rest="${rest%%]*}"
        while IFS= read -r entry; do
          entry=$(echo "$entry" | tr -d '",' | xargs)
          [ -n "$entry" ] && current_entries+=("$entry")
        done < <(echo "$rest" | tr ',' '\n')

        local missing=()
        for entry in "${current_entries[@]}"; do
          local normalized="${entry%/}"
          if ! grep -qxF "$entry" "$gitignore" && ! grep -qxF "$normalized" "$gitignore"; then
            missing+=("$entry")
          fi
        done

        if [ "${#missing[@]}" -gt 0 ]; then
          if [ "$has_logged" -eq 0 ]; then
            log_step "Applying $stack_name gitignore"
            has_logged=1
          fi

          if [ "${#missing[@]}" -eq "${#current_entries[@]}" ]; then
            echo "" >>"$gitignore"
            echo "$current_header" >>"$gitignore"
          fi

          for entry in "${missing[@]}"; do
            echo "$entry" >>"$gitignore"
            log_add "$entry"
          done
        fi

        current_header=""
        current_entries=()
      fi
    fi
  done <"$manifest"
}

resolve_missing_deps() {
  local stack_name="$1"
  local target_path="$2"
  local -n _missing=$3
  local tooling_dir="$PROJECT_ROOT/tooling"
  local manifest="$tooling_dir/$stack_name/manifest.toml"

  [ ! -f "$manifest" ] && return

  local extends
  extends=$(grep '^extends' "$manifest" | cut -d'"' -f2)

  if [ -n "$extends" ]; then
    resolve_missing_deps "$extends" "$target_path" "$3"
  fi

  local pkg="$target_path/package.json"
  [ ! -f "$pkg" ] && return

  local in_deps=0
  while IFS= read -r line; do
    if [[ "$line" =~ ^\[dependencies\.dev\] ]]; then
      in_deps=1
      continue
    fi

    if [[ "$in_deps" -eq 1 && "$line" =~ ^\[.+\] ]]; then
      break
    fi

    [ "$in_deps" -eq 0 ] && continue
    [ -z "$line" ] && continue
    [[ "$line" =~ ^packages ]] && continue

    local pkg_name
    pkg_name=$(echo "$line" | tr -d '"[],' | xargs)
    if [[ "$pkg_name" != @* ]]; then
      pkg_name="${pkg_name%%@*}"
    fi
    [ -z "$pkg_name" ] && continue

    local found
    found=$(node -e "
      const p = JSON.parse(require('fs').readFileSync('$pkg'));
      const all = Object.assign({}, p.dependencies, p.devDependencies);
      process.stdout.write(all['$pkg_name'] !== undefined ? 'yes' : 'no');
    " 2>/dev/null)

    if [ "$found" = "no" ]; then
      _missing+=("$pkg_name")
    fi
  done <"$manifest"
}

inject_tooling_manifest() {
  local stack_name="$1"
  local target_path="${2:-.}"
  local manifest="$PROJECT_ROOT/tooling/$stack_name/manifest.toml"

  [ ! -f "$manifest" ] && return

  local missing_deps=()
  resolve_missing_deps "$stack_name" "$target_path" missing_deps

  if [ "${#missing_deps[@]}" -gt 0 ]; then
    log_step "Installing missing dependencies"
    (cd "$target_path" && bun add -D "${missing_deps[@]}")
    for d in "${missing_deps[@]}"; do
      log_add "$d"
    done
  fi

  if [ -f "$target_path/package.json" ]; then
    local scripts
    scripts=$(awk '/^\[scripts\]/{f=1; next} /^\[/{f=0} f' "$manifest")

    if [ -n "$scripts" ]; then
      local to_apply_keys=()
      local to_apply_vals=()

      while IFS= read -r line; do
        if [[ "$line" =~ ^\"([^\"]+)\"[[:space:]]*=[[:space:]]*\"(.*)\"[[:space:]]*$ ]]; then
          local key="${BASH_REMATCH[1]}"
          local val="${BASH_REMATCH[2]}"
          local pkg_val
          pkg_val=$(node -e "
            const p = JSON.parse(require('fs').readFileSync('$target_path/package.json'));
            process.stdout.write(p.scripts && p.scripts['$key'] !== undefined ? p.scripts['$key'] : '__MISSING__');
          " 2>/dev/null)

          if [ "$pkg_val" = "__MISSING__" ]; then
            to_apply_keys+=("$key")
            to_apply_vals+=("$val")
          fi
        fi
      done <<<"$scripts"

      if [ "${#to_apply_keys[@]}" -gt 0 ]; then
        log_step "Applying $stack_name scripts"
        for key in "${to_apply_keys[@]}"; do
          log_add "$key"
        done

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
      fi
    fi
  fi

  merge_gitignore "$stack_name" "$target_path"
}

inject_dependencies() {
  log_step "Provisioning dependencies"

  if [ -f "package.json" ]; then
    if command -v bun &>/dev/null; then
      bun install
      log_info "Dependencies installed"
    else
      log_warn "package.json found but bun missing"
    fi
  elif [ -f "pyproject.toml" ] || [ -f "uv.lock" ]; then
    if command -v uv &>/dev/null; then
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
