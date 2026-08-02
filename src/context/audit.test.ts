import { describe, expect, it } from 'vitest'
import {
  CATALOG_ROW_CHECKPOINT,
  measureEntry,
  RUN_CHECKPOINT,
} from '@/context/audit'

const FRONTMATTER = '---\ntitle: CI\ndescription: A domain\n---\n\n'

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

function table(rows: string[]): string {
  return ['| Name | Purpose |', '| --- | --- |', ...rows].join('\n')
}

describe('measureEntry', () => {
  it('should count the whole file including its frontmatter', () => {
    const entry = measureEntry('ci.md', `${FRONTMATTER}# CI\n\n${prose(3)}\n`)

    expect(entry.lines).toBe(10)
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
})
