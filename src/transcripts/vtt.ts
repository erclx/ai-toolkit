export interface Cue {
  readonly timestamp: string
  readonly text: string
}

const VTT_TIMESTAMP = /^(\d\d:)?\d\d:\d\d\.\d{3} --> .*$/
const VTT_INLINE_TAG = /<[^>]+>/g
const VTT_NUMERIC_LINE = /^\d+$/

export function parseVtt(raw: string): Cue[] {
  const cues: Cue[] = []
  let currentTimestamp: string | null = null
  let currentLines: string[] = []
  let inHeader = true

  const flush = (): void => {
    if (currentTimestamp !== null && currentLines.length) {
      const text = currentLines.join(' ').trim()
      if (text) cues.push({ timestamp: currentTimestamp, text })
    }
    currentTimestamp = null
    currentLines = []
  }

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '')
    if (inHeader) {
      if (VTT_TIMESTAMP.test(line)) inHeader = false
      else continue
    }
    if (VTT_TIMESTAMP.test(line)) {
      flush()
      currentTimestamp = line.split(' --> ', 1)[0].trim()
      continue
    }
    if (line.trim() === '') {
      flush()
      continue
    }
    if (VTT_NUMERIC_LINE.test(line.trim())) continue
    const cleaned = line.replace(VTT_INLINE_TAG, '').trim()
    if (cleaned) currentLines.push(cleaned)
  }
  flush()
  return cues
}

export function dedupeRollingCues(cues: Cue[]): Cue[] {
  const deduped: Cue[] = []
  let running = ''
  for (const { timestamp, text } of cues) {
    const maxOverlap = Math.min(running.length, text.length)
    let overlap = 0
    for (let size = maxOverlap; size > 0; size -= 1) {
      if (running.endsWith(text.slice(0, size))) {
        overlap = size
        break
      }
    }
    const addition = text.slice(overlap).trim()
    if (!addition) continue
    running = `${running} ${addition}`.trim()
    deduped.push({ timestamp, text: addition })
  }
  return deduped
}

function vttTimestampToSeconds(stamp: string): number {
  const parts = stamp.split(':')
  let hours = '0'
  let minutes: string
  let rest: string
  if (parts.length === 3) [hours, minutes, rest] = parts
  else if (parts.length === 2) [minutes, rest] = parts
  else return 0
  const seconds = rest.split('.', 1)[0]
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
}

function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

interface RenderOptions {
  readonly keepTimestamps: boolean
}

export function renderBody(
  cues: Cue[],
  { keepTimestamps }: RenderOptions,
): string {
  if (!cues.length) return ''
  if (keepTimestamps) {
    const lines = cues.map(
      ({ timestamp, text }) =>
        `[${formatSeconds(vttTimestampToSeconds(timestamp))}] ${text}`,
    )
    return `${lines.join('\n')}\n`
  }
  const joined = cues.map(({ text }) => text).join(' ')
  return `${paragraphWrap(joined)}\n`
}

function paragraphWrap(text: string, wordsPerParagraph = 60): string {
  const words = text.split(/\s+/).filter(Boolean)
  if (!words.length) return ''
  const paragraphs: string[] = []
  for (let start = 0; start < words.length; start += wordsPerParagraph) {
    paragraphs.push(words.slice(start, start + wordsPerParagraph).join(' '))
  }
  return paragraphs.join('\n\n')
}
