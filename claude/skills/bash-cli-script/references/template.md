# Functional script template

Copy this skeleton for a non-interactive automation script. Keep only the parts the task needs.

```bash
#!/usr/bin/env bash
set -euo pipefail

log() { printf '%s\n' "$*" >&2; }

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat >&2 <<'EOF'
Usage: script.sh [options] <arg>
  -h, --help   Show this help
EOF
}

parse_args() {
  while [ $# -gt 0 ]; do
    case "$1" in
    -h | --help)
      usage
      exit 0
      ;;
    -*) die "unknown option: $1" ;;
    *) break ;;
    esac
    shift
  done
}

main() {
  parse_args "$@"
  log "starting"
}

main "$@"
```
