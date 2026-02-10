# CHANGELOG REFERENCE

## RULES

- Standard: Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format with [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
- Hierarchy: H1 title, H2 version+date or `[Unreleased]`, H3 category.
- Categories: Use `Added`, `Changed`, `Fixed`, `Deprecated`, `Security` as H3 headers.
- Entry Format: `- component: description from user perspective` (no bold markers or special formatting).
- Spacing: Include one blank line between H3 category headers and bullet lists.
- Version Links: Place at bottom in reverse chronological order; `[Unreleased]` compares latest release to HEAD.
- Content: Include only user-facing changes; exclude internal refactors, typos, CI/CD updates, and dependency bumps unless they affect functionality.

## CONSTRAINTS

- Do not include commits that do not affect end users (formatting changes, internal refactors, test updates).
- Do not use bold formatting for component names in entries.
- Do not write in prose; use concise bullet points.
- Do not include version sections with no meaningful changes.
- Do not mix developer-focused and user-focused changes in the same entry.

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

- editor: syntax highlighting for terraform files
- cli: `--watch` flag for continuous file monitoring

### Changed

- config: default timeout increased from 30s to 60s

### Fixed

- api: race condition in concurrent request handling

### Security

- auth: patch jwt verification vulnerability (CVE-2026-1234)
```

### Incorrect

```markdown
## [1.2.0] - 2026-02-10

### Added

- **Editor:** Added syntax highlighting for terraform files
- Fixed a typo in the README
- Updated CI pipeline to use Node 20
- Refactored internal parser logic for better performance

### Changed

- The default timeout has been increased from 30 seconds to 60 seconds to improve reliability and ensure seamless operation.
```