import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { listTopics, readTopic, resolveTopic } from '@/docs/read'

let ROOT: string

function writeDoc(relToRoot: string, content: string): void {
  const path = join(ROOT, relToRoot)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'aitk-docs-read-'))
  mkdirSync(join(ROOT, 'docs'), { recursive: true })
  mkdirSync(join(ROOT, '.claude', 'context'), { recursive: true })
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('resolveTopic', () => {
  it('should resolve a topic from the docs root', () => {
    writeDoc('docs/agents.md', '# Agents\n')

    expect(resolveTopic(ROOT, 'agents')).toEqual({
      path: join(ROOT, 'docs', 'agents.md'),
      rel: join('docs', 'agents.md'),
    })
  })

  it('should resolve a topic from the context root', () => {
    writeDoc('.claude/context/tooling.md', '# Tooling\n')

    expect(resolveTopic(ROOT, 'tooling')).toEqual({
      path: join(ROOT, '.claude', 'context', 'tooling.md'),
      rel: join('.claude', 'context', 'tooling.md'),
    })
  })

  it('should prefer the docs root when a name exists in both', () => {
    writeDoc('docs/shared.md', '# From docs\n')
    writeDoc('.claude/context/shared.md', '# From context\n')

    expect(resolveTopic(ROOT, 'shared')?.rel).toBe(join('docs', 'shared.md'))
  })

  it('should return undefined for a topic in neither root', () => {
    expect(resolveTopic(ROOT, 'bogus')).toBeUndefined()
  })
})

describe('listTopics', () => {
  it('should list each root in turn, sorted within the root', () => {
    writeDoc('docs/target-projects.md', 'a')
    writeDoc('docs/agents.md', 'b')
    writeDoc('.claude/context/tooling.md', 'c')
    writeDoc('.claude/context/cli.md', 'd')

    expect(listTopics(ROOT)).toEqual([
      'agents',
      'target-projects',
      'cli',
      'tooling',
    ])
  })

  it('should omit the index of each root', () => {
    writeDoc('docs/index.md', 'a')
    writeDoc('docs/agents.md', 'b')
    writeDoc('.claude/context/index.md', 'c')

    expect(listTopics(ROOT)).toEqual(['agents'])
  })

  it('should skip a root that does not exist', () => {
    rmSync(join(ROOT, '.claude'), { recursive: true, force: true })
    writeDoc('docs/agents.md', 'a')

    expect(listTopics(ROOT)).toEqual(['agents'])
  })
})

describe('readTopic', () => {
  it('should strip the frontmatter from the resolved document', () => {
    writeDoc('docs/agents.md', '---\ntitle: Agents\n---\n# Agents\n')
    const topic = resolveTopic(ROOT, 'agents')

    expect(topic && readTopic(topic)).toBe('# Agents\n')
  })

  it('should keep a body whose horizontal rules the bash would have eaten', () => {
    const body = '# Agents\n\n---\n\nsection two\n\n---\n\nsection three\n'
    writeDoc('docs/agents.md', `---\ntitle: Agents\n---\n${body}`)
    const topic = resolveTopic(ROOT, 'agents')

    expect(topic && readTopic(topic)).toBe(body)
  })
})
