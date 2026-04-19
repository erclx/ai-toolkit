import { readFileSync } from 'node:fs'

export type Row = Record<string, string>

export interface DesignDoc {
  personality: string
  color: Row[]
  typography: Row[]
  spacing: Row[]
  borders: Row[]
  motion: string
  iconography: string
}

export function parseDesignDoc(path: string): DesignDoc {
  const raw = readFileSync(path, 'utf8')
  const sections = splitSections(raw)
  return {
    personality: prose(sections['Personality']),
    color: table(sections['Color']),
    typography: table(sections['Typography']),
    spacing: table(sections['Spacing']),
    borders: table(sections['Borders']),
    motion: prose(sections['Motion']),
    iconography: prose(sections['Iconography']),
  }
}

function splitSections(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  const lines = raw.split('\n')
  let current: string | null = null
  let buffer: string[] = []
  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/)
    if (match) {
      if (current) out[current] = buffer.join('\n')
      current = match[1]
      buffer = []
    } else if (current) {
      buffer.push(line)
    }
  }
  if (current) out[current] = buffer.join('\n')
  return out
}

function prose(body: string | undefined): string {
  if (!body) return ''
  return body
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('|') && !l.startsWith('<'))
    .join('\n')
    .trim()
}

function table(body: string | undefined): Row[] {
  if (!body) return []
  const rows = body.split('\n').filter((l) => l.trim().startsWith('|'))
  if (rows.length < 2) return []
  const headers = splitRow(rows[0])
  const data = rows.slice(2)
  return data.map((line) => {
    const cells = splitRow(line)
    const row: Row = {}
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? '').trim()
    })
    return row
  })
}

function splitRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, '')
    .replace(/\|\s*$/, '')
    .split('|')
    .map((c) => c.trim().replace(/\s*\?\s*verify\s*$/, ''))
}
