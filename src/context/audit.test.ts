import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  CATALOG_ROW_CHECKPOINT,
  measureEntry,
  measureFolders,
  RENDER_WIDTH,
  RUN_CHECKPOINT,
} from '@/context/audit'
import { resolveFolders } from '@/context/folders'

const FRONTMATTER = '---\ntitle: CI\ndescription: A domain\n---\n\n'

/** Bullet counts the exempt catalog and the reported wall both hit. */
const PEER_COUNT = 55

/** Characters a bullet averages in each of the two shapes the corpus holds. */
const CATALOG_BULLET = 94
const PARAGRAPH_BULLET = 394

function prose(count: number): string {
  return Array.from({ length: count }, (_, index) => `Line ${index + 1}.`).join(
    '\n',
  )
}

function bullets(count: number, indent = ''): string {
  return Array.from(
    { length: count },
    (_, index) => `${indent}- Item ${index + 1}`,
  ).join('\n')
}

function weightedBullets(count: number, width: number): string {
  return Array.from({ length: count }, (_, index) =>
    `- Item ${index + 1} `.padEnd(width, 'weight '),
  ).join('\n')
}

function table(rows: string[]): string {
  return ['| Name | Purpose |', '| --- | --- |', ...rows].join('\n')
}

describe('measureEntry', () => {
  it('should count the whole file including its frontmatter', () => {
    const entry = measureEntry('ci.md', `${FRONTMATTER}# CI\n\n${prose(3)}\n`)

    expect(entry.lines).toBe(10)
  })

  it('should measure entry length in rendered lines rather than source lines', () => {
    const source = `${FRONTMATTER}# CI\n\n${weightedBullets(3, PARAGRAPH_BULLET)}\n`

    // Ten short lines render as ten, and each 394-character bullet wraps to
    // five, so three bullets stand in for fifteen of the checkpoint's budget.
    expect(measureEntry('ci.md', source).lines).toBe(22)
  })

  it('should report the longest run of lines no heading breaks', () => {
    const source = `${FRONTMATTER}# CI\n\n${prose(60)}\n\n## Layout\n\n${prose(5)}\n`

    expect(measureEntry('ci.md', source).longestRun).toBeGreaterThan(
      RUN_CHECKPOINT,
    )
  })

  it('should point at the first non-blank line of the longest run', () => {
    const source = `${FRONTMATTER}# CI\n\n${prose(60)}\n`

    expect(measureEntry('ci.md', source).longestRunLine).toBe(8)
  })

  it('should let a heading of any level break a run', () => {
    const half = prose(30)
    const source = `${FRONTMATTER}# CI\n\n${half}\n\n#### Seam\n\n${half}\n`

    expect(measureEntry('ci.md', source).longestRun).toBeLessThan(
      RUN_CHECKPOINT,
    )
  })

  it('should not count a heading that is markdown inside a fenced block', () => {
    const source = `${FRONTMATTER}# CI\n\n${prose(20)}\n\n\`\`\`markdown\n## Not a real heading\n\n### Nor this\n\`\`\`\n\n${prose(20)}\n`

    // The fence neither breaks the run nor adds to it, so the two prose
    // stretches measure as the single run a reader scrolls through.
    expect(measureEntry('ci.md', source).longestRun).toBe(43)
  })

  it('should exempt a run whose lines are all list items at one level', () => {
    const source = `${FRONTMATTER}# CI\n\n${bullets(60)}\n`

    expect(measureEntry('ci.md', source).longestRun).toBe(0)
  })

  it('should count a wrapped line as the rows it renders', () => {
    const source = `${FRONTMATTER}# CI\n\n${'x'.repeat(RENDER_WIDTH * 3)}\n`

    // The blank line after the heading is one row and the long line is three.
    expect(measureEntry('ci.md', source).longestRun).toBe(4)
  })

  it('should exempt a flat catalog of short peers', () => {
    const source = `${FRONTMATTER}# CI\n\n${weightedBullets(PEER_COUNT, CATALOG_BULLET)}\n`

    expect(measureEntry('ci.md', source).longestRun).toBe(0)
  })

  it('should report paragraph bullets at the count the catalog is exempt at', () => {
    const source = `${FRONTMATTER}# CI\n\n${weightedBullets(PEER_COUNT, PARAGRAPH_BULLET)}\n`

    expect(measureEntry('ci.md', source).longestRun).toBeGreaterThan(
      RUN_CHECKPOINT,
    )
  })

  it('should report a bullet block whose source lines stay under the checkpoint', () => {
    const source = `${FRONTMATTER}# CI\n\n${weightedBullets(15, PARAGRAPH_BULLET)}\n`

    // Fifteen bullets and a blank line are sixteen source lines, so only the
    // rendered measure reaches the checkpoint.
    expect(measureEntry('ci.md', source).longestRun).toBeGreaterThan(
      RUN_CHECKPOINT,
    )
  })

  it('should end the exemption when the list nests a second level', () => {
    const source = `${FRONTMATTER}# CI\n\n${bullets(30)}\n${bullets(30, '  ')}\n`

    expect(measureEntry('ci.md', source).longestRun).toBeGreaterThan(
      RUN_CHECKPOINT,
    )
  })

  it('should end the exemption when prose is mixed into the list', () => {
    const source = `${FRONTMATTER}# CI\n\n${bullets(30)}\nA sentence between them.\n${bullets(30)}\n`

    expect(measureEntry('ci.md', source).longestRun).toBeGreaterThan(
      RUN_CHECKPOINT,
    )
  })

  it('should report a table whose rows name artifacts as a growing catalog', () => {
    const rows = Array.from(
      { length: CATALOG_ROW_CHECKPOINT },
      (_, index) => `| \`aitk cmd-${index}\` | Does a thing |`,
    )
    const source = `${FRONTMATTER}# CI\n\n${table(rows)}\n`

    expect(measureEntry('ci.md', source).catalogTables).toEqual([
      { line: 8, rows: CATALOG_ROW_CHECKPOINT },
    ])
  })

  it('should leave a fixed table of the same size unreported', () => {
    const rows = Array.from(
      { length: CATALOG_ROW_CHECKPOINT },
      (_, index) => `| Concern ${index} | Some prose about it |`,
    )
    const source = `${FRONTMATTER}# CI\n\n${table(rows)}\n`

    expect(measureEntry('ci.md', source).catalogTables).toEqual([])
  })

  it('should leave a short catalog table unreported', () => {
    const rows = Array.from(
      { length: CATALOG_ROW_CHECKPOINT - 1 },
      (_, index) => `| \`aitk cmd-${index}\` | Does a thing |`,
    )
    const source = `${FRONTMATTER}# CI\n\n${table(rows)}\n`

    expect(measureEntry('ci.md', source).catalogTables).toEqual([])
  })

  it('should ignore a table that is an example inside a fenced block', () => {
    const rows = Array.from(
      { length: CATALOG_ROW_CHECKPOINT },
      (_, index) => `| \`aitk cmd-${index}\` | Does a thing |`,
    )
    const source = `${FRONTMATTER}# CI\n\n\`\`\`markdown\n${table(rows)}\n\`\`\`\n`

    expect(measureEntry('ci.md', source).catalogTables).toEqual([])
  })

  it('should report a date narrating when a change landed', () => {
    const source = `${FRONTMATTER}# CI\n\nThe cap was 20 until 2026-07-30.\n`

    expect(measureEntry('ci.md', source).provenance).toEqual([
      { line: 8, kind: 'date', text: '2026-07-30' },
    ])
  })

  it('should report a change number narrating which pull request carried it', () => {
    const source = `${FRONTMATTER}# CI\n\nThe path moved under #668 and stayed.\n`

    expect(measureEntry('ci.md', source).provenance).toEqual([
      { line: 8, kind: 'change', text: '#668' },
    ])
  })

  it('should report a release label attached to a change', () => {
    const source = `${FRONTMATTER}# CI\n\nEighteen skills have one as of v16.2.\n`

    expect(measureEntry('ci.md', source).provenance).toEqual([
      { line: 8, kind: 'release', text: 'v16.2' },
    ])
  })

  it('should report markers sharing a line left to right across kinds', () => {
    const source = `${FRONTMATTER}# CI\n\nRuns on #632 and #634 landed 2026-08-02.\n`

    expect(
      measureEntry('ci.md', source).provenance.map((found) => found.text),
    ).toEqual(['#632', '#634', '2026-08-02'])
  })

  it('should leave a date in frontmatter unreported', () => {
    // A diagram entry stamps `verified` with a short SHA and an ISO date, so
    // the frontmatter strip is what keeps the field a record of the last check
    // rather than a marker the report asks a reader to go and settle.
    const source = `---\ntitle: Components\nverified: 7b1107ac 2026-08-02\n---\n\n# Components\n\nThe boundary holds three layers.\n`

    expect(measureEntry('components.md', source).provenance).toEqual([])
  })

  it('should leave a version pinned inside a fenced block unreported', () => {
    const source = `${FRONTMATTER}# CI\n\n\`\`\`bash\nbunx -y aitk@v1.2.3 --since 2026-01-01\n\`\`\`\n`

    expect(measureEntry('ci.md', source).provenance).toEqual([])
  })

  it('should leave an entry stating only current shape unreported', () => {
    const source = `${FRONTMATTER}# CI\n\nThe cap is 30, above the highest observed run.\n`

    expect(measureEntry('ci.md', source).provenance).toEqual([])
  })

  it('should order findings by the line carrying them', () => {
    const source = `${FRONTMATTER}# CI\n\nShipped in #626.\n\nMeasured 2026-08-03.\n`

    expect(
      measureEntry('ci.md', source).provenance.map((found) => found.line),
    ).toEqual([8, 10])
  })

  it('should leave a marker unreported when no standard claims the content', () => {
    const source = `${FRONTMATTER}# Components\n\nThe third layer arrived in #755.\n`

    expect(measureEntry('components.md', source, false).provenance).toEqual([])
  })

  it('should keep measuring length and depth outside the governed folder', () => {
    const source = `${FRONTMATTER}# Components\n\n${prose(60)}\n`

    // Only the content rule narrows. A readability threshold generalizes
    // across entry types, so it keeps reaching every audited folder.
    expect(
      measureEntry('components.md', source, false).longestRun,
    ).toBeGreaterThan(RUN_CHECKPOINT)
  })
})

describe('measureFolders', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'aitk-audit-'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  function seed(relativeDir: string, name: string, body: string): void {
    const dir = join(root, relativeDir)
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, 'index.md'),
      '---\ntitle: X\nsubtitle: Y\n---\n\n# X\n',
    )
    writeFileSync(join(dir, name), `${FRONTMATTER}${body}`)
  }

  const NARRATED = '# X\n\nThe third layer arrived in #755.\n'

  async function provenanceOf(rel: string): Promise<number> {
    const reports = await measureFolders(root, await resolveFolders(root))

    return reports.find((entry) => entry.rel === rel)?.provenance.length ?? -1
  }

  it('should report a marker in an entry the rule governs', async () => {
    seed('.claude/context', 'ci.md', NARRATED)

    expect(await provenanceOf('.claude/context/ci.md')).toBe(1)
  })

  it('should leave a marker in a diagram entry unreported', async () => {
    seed('.claude/diagrams', 'components.md', NARRATED)

    expect(await provenanceOf('.claude/diagrams/components.md')).toBe(0)
  })

  it('should govern a split domain by the folder it sits beneath', async () => {
    seed('.claude/context', 'ci.md', '# X\n')
    seed('.claude/context/claude-plugin', 'skills.md', NARRATED)

    expect(await provenanceOf('.claude/context/claude-plugin/skills.md')).toBe(
      1,
    )
  })
})
