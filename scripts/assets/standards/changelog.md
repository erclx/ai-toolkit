# CHANGELOG REFERENCE

## Format

- Standard: Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) with [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
- Hierarchy: H1 title, H2 version+date or `[Unreleased]`, H3 category
- Entry format: `- component: description`
- No bold formatting for component names in entries
- No prose; use concise bullet points

## Categories

- Use `Added`, `Changed`, `Fixed`, `Deprecated`, `Security` as H3 headers
- Do not include version sections with no meaningful changes

## Entries

- Include only user-facing changes
- Exclude internal refactors, typos, CI/CD updates, and dependency bumps unless they affect functionality
- Do not mix developer-focused and user-focused changes in the same entry

## Versioning

- Place version links at bottom in reverse chronological order
- `[Unreleased]` compares latest release to HEAD

## EXAMPLES

### Template

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- component: description of new feature from user perspective

### Changed

- component: description of change and its impact

### Fixed

- component: specific bug fix description

### Deprecated

- component: description of what is being phased out

### Removed

- component: description of removed feature

## [1.0.0] - 2026-01-20

### Added

- auth: oauth2 token refresh support
- api: rate limiting with configurable thresholds

### Fixed

- parser: incorrect handling of nested json objects

[Unreleased]: https://github.com/user/repo/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/user/repo/releases/tag/v1.0.0
```

### Correct

```markdown
## [1.2.0] - 2026-02-10

### Added

- editor: syntax highlighting for terraform files # user-facing, specific component
- cli: `--watch` flag for continuous file monitoring # concrete capability added

### Changed

- config: default timeout increased from 30s to 60s # measurable change, user impact clear

### Fixed

- api: race condition in concurrent request handling # specific bug, no internal detail

### Security

- auth: patch jwt verification vulnerability (CVE-2026-1234) # cve reference, scoped
```

### Incorrect

```markdown
## [1.2.0] - 2026-02-10

### Added

- **Editor:** Added syntax highlighting for terraform files # bold formatting + past tense
- Fixed a typo in the README # non-user-facing change
- Updated CI pipeline to use Node 20 # internal, no user impact
- Refactored internal parser logic for better performance # developer-focused

### Changed

- The default timeout has been increased from 30s to 60s to improve reliability and ensure seamless operation. # prose + buzzword
```
