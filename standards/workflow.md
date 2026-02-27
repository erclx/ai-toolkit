# GITHUB WORKFLOW REFERENCE

## Conventions

- Include `workflow_dispatch` on every workflow alongside the primary trigger
- Pin all actions to major version tags (`@v4`, never `@latest` or `@main`)
- Use `runs-on: ubuntu-latest` for all jobs
- Name jobs with emoji + title: `🛡️ Static Checks`, `🧪 Unit Tests`, `📦 Build Check`, `🎭 E2E Tests`, `🚀 Deploy`, `🔍 Code Quality`, `🏷️ Release`, `🔒 Security`
- Gate slow or expensive jobs behind fast ones using `needs`
- Job order: static → unit → build → e2e/deploy
- Upload artifacts on `if: failure()` only; set `retention-days: 7`

## Bun Stack

- Use `oven-sh/setup-bun@v2` with `bun-version: latest`
- Always install with `bun install --frozen-lockfile`
- Cache Playwright browsers keyed on Playwright version string, never a static key

## EXAMPLES

### Incorrect

```yaml
- uses: actions/checkout@latest # unpinned action
- run: bun install # missing --frozen-lockfile
- name: Unit Tests # missing emoji
- needs: [] # e2e not gated behind static/unit
- uses: actions/upload-artifact@v4 # uploads on every run, not just failure
- key: playwright-browsers # static cache key, never invalidates
```
