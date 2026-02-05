# Python FastAPI project with uv

This project is a FastAPI web application.
It uses `uv` for package management, `just` for running commands, and `Ruff` for linting.

---

## Building and running

### Set up the development environment

Install dependencies and set up pre-commit hooks:

```bash
uv sync
uv run pre-commit install

```

### Start the development server

Run the FastAPI server with hot reloading enabled:

```bash
just dev

```

### Run tests

Execute unit and integration tests:

```bash
just test

```

### Lint and format

Clean up the codebase using Ruff:

```bash
just lint
just format

```

### Build and run Docker locally

Build the container image and start it for testing:

```bash
just preview

```

---

## Development conventions

### Dependency management

Use `uv` for all dependency tasks.
Do not use `pip`.

- **Add a library**: `uv add <package>`
- **Add a dev tool**: `uv add --dev <package>`
- **Sync the environment**: `uv sync`

### File structure

- `src/app/`: Application source code.
- `tests/`: Test files that mirror the `src/app/` structure.

### Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/).
Examples include `feat: add new feature` or `fix: resolve bug`.

### Pre-commit hooks

The project runs automated checks during every commit.
These hooks include `ruff`, `gitleaks`, and basic file cleanup.
