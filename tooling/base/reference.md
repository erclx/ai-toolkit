# Tooling base reference

## Runtime

- Use `bun` as package manager and script runner.
- Use `bunx` instead of `npx` for one-off executables.

## Prettier

- Config: `.prettierrc` (JSON) at root.
- Rules: `semi: false`, `singleQuote: true`.
- Add parser overrides for non-standard extensions (e.g., `.mdc` → `markdown`).
- Ignore paths via `.gitignore` and `.prettierignore`. Pass both as `--ignore-path` on all prettier invocations.
- `.prettierignore` is a user-owned seed. It is created empty on install. Projects add their own entries.
- Use `--log-level warn` on all prettier invocations to suppress per-file `(unchanged)` output.

## Dev Dependencies

- `prettier`, `cspell`, `husky`, `@commitlint/cli`, `@commitlint/config-conventional`.
- Install via `bun add -D`.
- Ensure `.gitignore` contains `node_modules/`.

## CSpell

- Config: `cspell.json` at root.
- Include `version: "0.2"` and `language: "en"`.
- Set `useGitignore: true` to skip ignored paths.
- Dictionary files in `.cspell/`: `project-terms.txt`, `tech-stack.txt`.
- Set `addWords: true` on each dictionary definition.
- Add `ignorePaths: [".cspell/**", ".git/**"]` to skip dictionary self-checks and git object files.
- Include dotfolders in the spell glob: `cspell '**' '.*/**' '.*' ...`. The default `**` skips dot-prefixed folders, so `.claude/`, `.github/`, and `.husky/` go unchecked without explicit globs.
- Keep dictionary entries sorted alphabetically, one word per line.

## Shell Tooling

- Format: `shfmt --indent 2 scripts/`. shfmt supports directory args natively, no `find` needed.
- Lint: `find scripts -name '*.sh' -exec shellcheck --severity=warning {} +`. shellcheck has no directory mode, `find` is required.
- Config: `.shellcheckrc` with `external-sources=true`. Required for shellcheck to follow `source` directives. Keep even with EditorConfig present.
- All shell scripts live in `scripts/`. Do not place `.sh` files outside `scripts/`.
- EditorConfig: `.editorconfig` at root with `[*.sh]` block enforcing `indent_style = space`, `indent_size = 2`. Prevents editor/shfmt conflicts that produce spurious git diffs.

## Commit Lint

- Config: `commitlint.config.js` (ESM default export).
- Extends: `@commitlint/config-conventional`.
- Rules: `header-max-length: 72`, `scope-case: lower-case`, `subject-full-stop: never`, `subject-case: disabled`.
- Format: `<type>(<scope>): <subject>` (imperative mood, no trailing period).

## Husky + Lint-Staged

- Config: `.lintstagedrc` (JSON) at root.
- Hooks in `.husky/`:
  - `pre-commit` → `bunx lint-staged`
  - `commit-msg` → `bunx commitlint --edit "$1"`
  - `pre-push` → `bun run check`
- Lint-staged globs:
  - `**/*.{json,md,mdc}` → `["prettier --write --ignore-path .gitignore --ignore-path .prettierignore", "cspell --no-must-find-files"]`
  - `**/*.sh` → `["shfmt --write --indent 2", "shellcheck --severity=warning"]`
- Note: lint-staged handles its own glob expansion and passes matched files as arguments. `**/*.sh` is safe here, unlike in package.json scripts.

## GitHub

- PR template: `.github/pull_request_template.md`.
- Sections: `## Summary`, `## Key Changes`, `## Technical Context`, `## Testing`.
- Visuals: HTML comment only, never a visible section header.
- Follow `standards/pr.md`: imperative mood, no "This PR" opener, no buzzwords, name specific files and functions.
- CI workflow: `.github/workflows/verify.yml`. Runs on pull requests targeting `main` and on `workflow_dispatch`.
- Workflow steps: checkout, setup Bun (latest), `bun install --frozen-lockfile`, install `shfmt` and `shellcheck` via apt, then `check:format`, `check:spell`, `check:shell`.
- Does not run `format` before asserting. CI asserts only. Format must be clean before push.

## Gitignore

- `# System`: `.DS_Store`
- `# Dependencies`: `node_modules/`
- `# Secrets`: `.env`, `.env.*`, `*.local`, `!.env.example`
- `# Cursor`: `.cursor/.tmp/`

## Scripts

- Entry: `scripts/` directory with `verify.sh`, `clean.sh`, `update.sh`.
- All scripts use logging functions from the bash script reference.
- `verify.sh`: self-healing: runs `format` first to auto-fix AI-generated or drifted code, then asserts with `check:format`. Supports `VERIFY_NESTED=true` to suppress timeline boundaries when called by other scripts.
- `clean.sh`: removes `node_modules/`, clears bun cache, reinstalls dependencies fresh.
- `update.sh`: runs `bun update --interactive` then calls `verify.sh` with `VERIFY_NESTED=true` to confirm project health after updates.

## EditorConfig

- Config: `.editorconfig` at root, `root = true`.
- `[*.sh]`: `indent_style = space`, `indent_size = 2`.
- Ensures consistent shell script indentation across editors, preventing shfmt vs editor conflicts that produce spurious git diffs.

## VS Code

- Extensions: `esbenp.prettier-vscode`, `streetsidesoftware.code-spell-checker`, `mkhl.shfmt`, `timonwong.shellcheck`, `mads-hartmann.bash-ide-vscode`.
- Settings: `shellcheck.customArgs: ["--severity=warning"]`.

## Package Scripts

- `check:spell`: runs cspell across all files, shows context on failures.
- `check:format`: checks prettier and shfmt formatting without writing. shfmt targets `scripts/` directory directly. Uses `--log-level warn` and both `--ignore-path .gitignore --ignore-path .prettierignore`.
- `check:shell`: runs shellcheck at warning severity via `find scripts -name '*.sh'` (shellcheck has no directory mode).
- `format`: writes prettier and shfmt formatting in place. shfmt targets `scripts/` directory directly. Uses `--log-level warn` and both `--ignore-path .gitignore --ignore-path .prettierignore`.
- `prepare`: initializes husky hooks (runs automatically on `bun install`).
- `check`: runs `scripts/verify.sh`, the full verification suite. Auto-formats before asserting.
- `clean`: runs `scripts/clean.sh`, wipes and reinstalls dependencies.
- `update`: runs `scripts/update.sh`, interactive dependency update with verification.
