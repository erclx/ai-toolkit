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
  ROOT = mkdtempSync(join(tmpdir(), 'canon-docs-read-'))
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

  it('should resolve a topic split into a folder to its index', () => {
    writeDoc('.claude/context/claude-plugin/index.md', '# Claude plugin\n')

    expect(resolveTopic(ROOT, 'claude-plugin')).toEqual({
      path: join(ROOT, '.claude', 'context', 'claude-plugin', 'index.md'),
      rel: join('.claude', 'context', 'claude-plugin', 'index.md'),
    })
  })

  it('should prefer a sibling file over a folder of the same name', () => {
    writeDoc('.claude/context/both.md', '# From the file\n')
    writeDoc('.claude/context/both/index.md', '# From the folder\n')

    expect(resolveTopic(ROOT, 'both')?.rel).toBe(
      join('.claude', 'context', 'both.md'),
    )
  })

  it('should return undefined for a folder carrying no index', () => {
    writeDoc('.claude/context/headless/skills.md', '# Skills\n')

    expect(resolveTopic(ROOT, 'headless')).toBeUndefined()
  })

  it('should resolve a sub-area file by its bare name', () => {
    writeDoc('docs/workflow/index.md', '# Workflow\n')
    writeDoc('docs/workflow/operating-model.md', '# Operating model\n')

    expect(resolveTopic(ROOT, 'operating-model')).toEqual({
      path: join(ROOT, 'docs', 'workflow', 'operating-model.md'),
      rel: join('docs', 'workflow', 'operating-model.md'),
    })
  })

  it('should prefer a root file over a leaf of the same name', () => {
    writeDoc('docs/routing.md', '# From the root\n')
    writeDoc('docs/agents/index.md', '# Agents\n')
    writeDoc('docs/agents/routing.md', '# From the leaf\n')

    expect(resolveTopic(ROOT, 'routing')?.rel).toBe(join('docs', 'routing.md'))
  })

  it('should prefer a root file in the second root over a leaf in the first', () => {
    writeDoc('.claude/context/indexes.md', '# From the context root\n')
    writeDoc('docs/agents/index.md', '# Agents\n')
    writeDoc('docs/agents/indexes.md', '# From the docs leaf\n')

    expect(resolveTopic(ROOT, 'indexes')?.rel).toBe(
      join('.claude', 'context', 'indexes.md'),
    )
  })

  it('should prefer a split folder over a leaf of the same name', () => {
    writeDoc('.claude/context/sandbox/index.md', '# From the folder\n')
    writeDoc('docs/agents/index.md', '# Agents\n')
    writeDoc('docs/agents/sandbox.md', '# From the leaf\n')

    expect(resolveTopic(ROOT, 'sandbox')?.rel).toBe(
      join('.claude', 'context', 'sandbox', 'index.md'),
    )
  })

  it('should return undefined for a leaf name carried by two folders', () => {
    writeDoc('.claude/context/cli/index.md', '# CLI\n')
    writeDoc('.claude/context/cli/overview.md', '# CLI overview\n')
    writeDoc('.claude/context/sandbox/index.md', '# Sandbox\n')
    writeDoc('.claude/context/sandbox/overview.md', '# Sandbox overview\n')

    expect(resolveTopic(ROOT, 'overview')).toBeUndefined()
  })

  it('should return undefined for a leaf name carried across both roots', () => {
    writeDoc('docs/agents/index.md', '# Agents\n')
    writeDoc('docs/agents/overview.md', '# Agents overview\n')
    writeDoc('.claude/context/cli/index.md', '# CLI\n')
    writeDoc('.claude/context/cli/overview.md', '# CLI overview\n')

    expect(resolveTopic(ROOT, 'overview')).toBeUndefined()
  })

  it('should not resolve a leaf inside a folder carrying no index', () => {
    writeDoc('.claude/context/headless/skills.md', '# Skills\n')

    expect(resolveTopic(ROOT, 'skills')).toBeUndefined()
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

  it('should list a folder topic beside the sibling files, sorted together', () => {
    writeDoc('.claude/context/tooling.md', 'a')
    writeDoc('.claude/context/cli.md', 'b')
    writeDoc('.claude/context/claude-plugin/index.md', 'c')
    writeDoc('.claude/context/claude-plugin/skills.md', 'd')

    expect(listTopics(ROOT)).toEqual([
      'claude-plugin',
      'cli',
      'skills',
      'tooling',
    ])
  })

  it('should omit a nested folder that carries no index', () => {
    writeDoc('.claude/context/cli.md', 'a')
    writeDoc('.claude/context/headless/skills.md', 'b')

    expect(listTopics(ROOT)).toEqual(['cli'])
  })

  it('should skip a root that does not exist', () => {
    rmSync(join(ROOT, '.claude'), { recursive: true, force: true })
    writeDoc('docs/agents.md', 'a')

    expect(listTopics(ROOT)).toEqual(['agents'])
  })

  it('should list a sub-area file beside the folder holding it', () => {
    writeDoc('docs/workflow/index.md', 'a')
    writeDoc('docs/workflow/operating-model.md', 'b')
    writeDoc('docs/target-projects.md', 'c')

    expect(listTopics(ROOT)).toEqual([
      'operating-model',
      'target-projects',
      'workflow',
    ])
  })

  it('should omit a leaf a root file already names', () => {
    writeDoc('.claude/context/indexes.md', 'a')
    writeDoc('docs/agents/index.md', 'b')
    writeDoc('docs/agents/indexes.md', 'c')

    expect(listTopics(ROOT)).toEqual(['agents', 'indexes'])
  })

  it('should omit a leaf name carried by two folders', () => {
    writeDoc('.claude/context/cli/index.md', 'a')
    writeDoc('.claude/context/cli/overview.md', 'b')
    writeDoc('.claude/context/sandbox/index.md', 'c')
    writeDoc('.claude/context/sandbox/overview.md', 'd')

    expect(listTopics(ROOT)).toEqual(['cli', 'sandbox'])
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
