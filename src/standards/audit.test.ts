import { execaSync } from 'execa'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  auditExitCode,
  auditStandards,
  EXIT_MISSING_CRITERION,
} from '@/standards/audit'

const WITH_CRITERION = `---
title: Fixture reference
description: A fixture standard
---

# Fixture reference

## Scope

Governs nothing real.

## Success criterion

- Answers a question a reviewer can check.
`

const WITH_TEMPLATE_CRITERION = `---
title: Fixture reference
description: A fixture standard
---

# Fixture reference

## Scope

Governs nothing real.

## What a working fixture looks like

- Answers a question a reviewer can check.
`

const WITHOUT_CRITERION = `---
title: Fixture reference
description: A fixture standard
---

# Fixture reference

## Scope

Governs nothing real.
`

function write(root: string, path: string, text: string): void {
  const full = join(root, path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, text)
}

/**
 * Runs git against the fixture with the ambient environment dropped.
 *
 * A git hook exports `GIT_DIR` into the processes it runs and that variable
 * takes precedence over `-C`, so a bare call would read whichever repository
 * invoked the suite rather than the fixture's own history.
 */
function git(root: string, args: string[]): string {
  return execaSync('git', ['-C', root, ...args], {
    extendEnv: false,
    env: {},
  }).stdout.trimEnd()
}

describe('auditStandards', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'canon-standards-audit-'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('should refuse a project authoring no standards', async () => {
    await expect(auditStandards(root)).resolves.toEqual({
      kind: 'refused',
      reason: 'no-corpus',
    })
  })

  describe('against a repository', () => {
    beforeEach(() => {
      git(root, ['init', '--initial-branch=main'])
      git(root, ['config', 'user.email', 'test@example.com'])
      git(root, ['config', 'user.name', 'Test'])
      write(root, 'standards/existing.md', WITHOUT_CRITERION)
      git(root, ['add', '-A'])
      git(root, ['commit', '-m', 'first'])
      git(root, ['checkout', '-b', 'feat/x'])
    })

    it('should not fail the gate on an existing standard lacking the section', async () => {
      const report = await auditStandards(root)

      expect(report.kind).toBe('measured')
      expect(report.kind === 'measured' && report.withoutCriterion).toEqual([
        'existing.md',
      ])
      expect(report.kind === 'measured' && report.arrivals).toEqual([])
      expect(auditExitCode(report)).toBe(0)
    })

    it('should fail the gate on an arriving standard with no section, naming it', async () => {
      write(root, 'standards/new.md', WITHOUT_CRITERION)

      const report = await auditStandards(root)

      expect(
        report.kind === 'measured' && report.arrivalsWithoutCriterion,
      ).toEqual(['new.md'])
      expect(auditExitCode(report)).toBe(EXIT_MISSING_CRITERION)
    })

    it('should pass an arriving standard that carries the section', async () => {
      write(root, 'standards/new.md', WITH_CRITERION)

      const report = await auditStandards(root)

      expect(report.kind === 'measured' && report.arrivals).toEqual(['new.md'])
      expect(
        report.kind === 'measured' && report.arrivalsWithoutCriterion,
      ).toEqual([])
      expect(auditExitCode(report)).toBe(0)
    })

    it('should pass an arriving standard whose criterion carries the template heading', async () => {
      write(root, 'standards/new.md', WITH_TEMPLATE_CRITERION)

      const report = await auditStandards(root)

      expect(report.kind === 'measured' && report.arrivals).toEqual(['new.md'])
      expect(
        report.kind === 'measured' && report.arrivalsWithoutCriterion,
      ).toEqual([])
      expect(auditExitCode(report)).toBe(0)
    })

    it('should count a rename into the corpus as an arrival', async () => {
      git(root, ['mv', 'standards/existing.md', 'standards/renamed.md'])

      const report = await auditStandards(root)

      expect(report.kind === 'measured' && report.arrivals).toEqual([
        'renamed.md',
      ])
      expect(
        report.kind === 'measured' && report.arrivalsWithoutCriterion,
      ).toEqual(['renamed.md'])
    })
  })
})
