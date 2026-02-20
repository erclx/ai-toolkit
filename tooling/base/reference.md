# TOOLING BASE REFERENCE

## Runtime

- Use `bun` as package manager and script runner.
- Use `bunx` instead of `npx` for one-off executables.

## Prettier

- Config: `.prettierrc` (JSON) at root.
- Rules: `semi: false`, `singleQuote: true`.
- Add parser overrides for non-standard extensions (e.g., `.mdc` → `markdown`).
- Ignore paths via `.gitignore` — do not create `.prettierignore`.

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
- Add `ignorePaths: [".cspell/**"]` to avoid self-checking dictionaries.
- Keep dictionary entries sorted alphabetically, one word per line.

## Shell Tooling

- Lint: `shellcheck` with `--severity=warning`.
- Format: `shfmt` with `--indent 2`.
- Config: `.shellcheckrc` with `external-sources=true`.
- Project `.vscode/settings.json` with `"shellcheck.customArgs": ["--severity=warning"]`.

## Commit Lint

- Config: `commitlint.config.js` (ESM default export).
- Extends: `@commitlint/config-conventional`.
- Rules: `header-max-length: 72`, `scope-case: lower-case`, `subject-full-stop: never`, `subject-case: disabled`.
- Format: `<type>(<scope>): <subject>` — imperative mood, no trailing period.

## Husky + Lint-Staged

- Config: `.lintstagedrc` (JSON) at root.
- Hooks in `.husky/`:
  - `pre-commit` → `bunx lint-staged`
  - `commit-msg` → `bunx commitlint --edit "$1"`
  - `pre-push` → `bun run check`
- Lint-staged globs:
  - `**/*.{json,md,mdc}` → `["prettier --write --ignore-path .gitignore", "cspell --no-must-find-files"]`
  - `**/*.sh` → `["shfmt --write --indent 2", "shellcheck --severity=warning"]`

## Scripts

- Entry: `scripts/` directory with `verify.sh`, `clean.sh`, `update.sh`.
- All scripts use logging functions from the bash script reference.
- `verify.sh` supports `--nested` flag to suppress timeline boundaries when called by other scripts.
- `update.sh` calls `verify.sh --nested` after interactive dependency update.

## VS Code

- Extensions: `esbenp.prettier-vscode`, `streetsidesoftware.code-spell-checker`, `mkhl.shfmt`, `timonwong.shellcheck`, `mads-hartmann.bash-ide-vscode`.
- Settings: `shellcheck.customArgs: ["--severity=warning"]`.

## Package Scripts

- `check:spell` — `cspell '**' --no-progress --color --show-context`
- `check:format` — `prettier --check --ignore-path .gitignore . && shfmt --diff --indent 2 **/*.sh`
- `check:shell` — `shellcheck --severity=warning **/*.sh`
- `format` — `prettier --write --ignore-path .gitignore . && shfmt --write --indent 2 **/*.sh`
- `prepare` — `husky`
- `check` — `./scripts/verify.sh`
- `clean` — `./scripts/clean.sh`
- `update` — `./scripts/update.sh`
