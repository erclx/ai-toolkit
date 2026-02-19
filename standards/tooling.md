# TOOLING BASE REFERENCE

## Runtime

- Use `bun` as package manager and script runner.
- Use `bunx` instead of `npx` for one-off executables.

## Prettier

- Config: `.prettierrc` (JSON) at root.
- Rules: `semi: false`, `singleQuote: true`.
- Add parser overrides for non-standard extensions (e.g., `.mdc` → `markdown`).
- Ignore paths via `.gitignore` — do not create `.prettierignore`.

## Commit Lint

- Config: `commitlint.config.js` (ESM default export).
- Extends: `@commitlint/config-conventional`.
- Rules: `header-max-length: 72`, `scope-case: lower-case`, `subject-full-stop: never`, `subject-case: disabled`.
- Format: `<type>(<scope>): <subject>` — imperative mood, no trailing period.

## CSpell

- Config: `cspell.json` at root.
- Set `useGitignore: true` to skip ignored paths.
- Include `version: "0.2"` and `language: "en"`.
- Dictionary files in `.cspell/`: `project-terms.txt`, `tech-stack.txt`.
- Set `addWords: true` on each dictionary definition.
- Add `ignorePaths: [".cspell/**"]` to avoid self-checking dictionaries.

## Shell Tooling

- Lint: `shellcheck` with `--severity=warning`.
- Format: `shfmt` with `--indent 2`.
- Config: `.shellcheckrc` with `external-sources=true`.
- Project `.vscode/settings.json` with `"shellcheck.customArgs": ["--severity=warning"]` (no CLI config equivalent).

## Husky + Lint-Staged

- Config: `.lintstagedrc` (JSON) at root.
- Hooks in `.husky/`:
  - `pre-commit` → `bunx lint-staged`
  - `commit-msg` → `bunx commitlint --edit "$1"`
  - `pre-push` → `bun run check`
- Lint-staged globs:
  - `**/*.{json,md,mdc}` → `["prettier --write --ignore-path .gitignore", "cspell --no-must-find-files"]`
  - `**/*.sh` → `["shfmt --write --indent 2", "shellcheck --severity=warning"]`

## Verification Script

- Entry: `scripts/verify.sh`, invoked via `bun run check`.
- Runs checks sequentially: format → spelling → shell.
- Exits on first failure.
- Uses logging functions from the bash script reference (`log_step`, `log_info`, `log_error`).
- Pattern: `log_step` per check, run command with `|| log_error`, then `log_info` on pass.

## VS Code Extensions

- `esbenp.prettier-vscode`, `streetsidesoftware.code-spell-checker`
- `mkhl.shfmt`, `timonwong.shellcheck`, `mads-hartmann.bash-ide-vscode`

## Package Scripts

- `check:spell` — cspell all files with context output.
- `check:format` — prettier check + shfmt diff.
- `check:shell` — shellcheck all `.sh` files.
- `format` — prettier write + shfmt write.
- `prepare` — husky install.
- `check` — runs `scripts/verify.sh`.

## EXAMPLES

### Correct

```json
{ "semi": false, "singleQuote": true }                          # .prettierrc minimal
```

```sh
bunx lint-staged                                                 # pre-commit hook
bunx commitlint --edit "$1"                                      # commit-msg hook
bun run check                                                    # pre-push hook
```

```text
feat(api): add retry logic for failed webhooks                   # specific verb + scoped
fix(auth): update token validation logic                         # imperative mood
```

### Incorrect

```sh
npx lint-staged                                                  # use bunx not npx
npm run check                                                    # use bun not npm
```

```text
fix(user-auth): Fixed the redirect loop.                         # multi-word scope + period + past tense
docs(docs): update the readme.                                   # duplicated scope + period
```
