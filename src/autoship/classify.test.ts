import { describe, expect, it } from 'vitest'
import { classifyChanges } from '@/autoship/classify'

describe('classifyChanges', () => {
  it('should skip review when every changed file is informational prose', () => {
    const result = classifyChanges([
      'CHANGELOG.md',
      'README.md',
      'docs/agents/commands.md',
      'notes/scratch.txt',
    ])

    expect(result).toEqual({ kind: 'skip' })
  })

  it('should send a markdown branch to review when one file sits under a behavior path', () => {
    const result = classifyChanges([
      'docs/agents/commands.md',
      '.claude/skills/deploy-check/SKILL.md',
    ])

    expect(result).toEqual({
      kind: 'review',
      test: 'behavior-path',
      file: '.claude/skills/deploy-check/SKILL.md',
    })
  })

  it('should refuse an empty changed set rather than reading it as prose-only', () => {
    const result = classifyChanges([])

    expect(result).toEqual({ kind: 'refused', reason: 'no-changes' })
  })

  it('should name the extension test when a changed file is not prose', () => {
    const result = classifyChanges(['docs/index.md', 'src/cli.ts'])

    expect(result).toEqual({
      kind: 'review',
      test: 'extension',
      file: 'src/cli.ts',
    })
  })

  it('should read the root instruction file as a behavior surface', () => {
    const result = classifyChanges(['CLAUDE.md'])

    expect(result).toEqual({
      kind: 'review',
      test: 'behavior-path',
      file: 'CLAUDE.md',
    })
  })

  it('should leave a nested instruction file informational', () => {
    const result = classifyChanges(['docs/CLAUDE.md'])

    expect(result).toEqual({ kind: 'skip' })
  })

  it('should reach both spellings of an installed behavior surface', () => {
    expect(classifyChanges(['governance/rules/core/005-behavior.md'])).toEqual({
      kind: 'review',
      test: 'behavior-path',
      file: 'governance/rules/core/005-behavior.md',
    })

    expect(classifyChanges(['.claude/rules/core/005-behavior.md'])).toEqual({
      kind: 'review',
      test: 'behavior-path',
      file: '.claude/rules/core/005-behavior.md',
    })
  })

  it('should read a prose extension case-insensitively', () => {
    expect(classifyChanges(['README.MD'])).toEqual({ kind: 'skip' })
  })
})
