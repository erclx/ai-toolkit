import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Command } from 'commander'
import { PROJECT_ROOT } from '@/exec'

const GREY = '\x1b[0;90m'
const WHITE = '\x1b[1;37m'
const RED = '\x1b[0;31m'
const GREEN = '\x1b[0;32m'
const NC = '\x1b[0m'

const SLUG_FALLBACK = 'general'
const SLUG_MAX_LENGTH = 40

function frameError(message: string): void {
  process.stderr.write(
    `${GREY}┌${NC}\n${GREY}│${NC} ${RED}✗${NC} ${message}\n${GREY}└${NC}\n`,
  )
}

function readStdin(): Promise<string> {
  return new Promise((resolveStream, rejectStream) => {
    const chunks: Buffer[] = []
    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk))
    process.stdin.on('end', () =>
      resolveStream(Buffer.concat(chunks).toString('utf8')),
    )
    process.stdin.on('error', rejectStream)
  })
}

function deriveSlug(body: string): string {
  const surfaceMatch = body.match(/\*\*Surface:\*\*\s*([^\n]+)/i)
  const candidate = surfaceMatch?.[1] ?? ''
  const slug = candidate
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, '')
  return slug || SLUG_FALLBACK
}

function timestamp(): string {
  const d = new Date()
  const pad = (n: number): string => n.toString().padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

export function register(program: Command): void {
  program
    .command('feedback')
    .description('Write toolkit feedback from stdin to .claude/review/')
    .action(async () => {
      if (process.stdin.isTTY) {
        frameError(
          'No feedback on stdin. Pipe a markdown block: pbpaste | aitk feedback',
        )
        process.exit(1)
      }
      const body = (await readStdin()).trim()
      if (!body) {
        frameError('Empty feedback body. Provide a markdown block on stdin.')
        process.exit(1)
      }
      const reviewDir = join(PROJECT_ROOT, '.claude', 'review')
      mkdirSync(reviewDir, { recursive: true })
      const filename = `feedback-${deriveSlug(body)}-${timestamp()}.md`
      const filePath = join(reviewDir, filename)
      writeFileSync(filePath, `${body}\n`, 'utf8')
      process.stderr.write(
        `${GREY}┌${NC}\n${GREY}│${NC} ${WHITE}aitk feedback${NC}\n${GREY}│${NC}\n${GREY}│${NC} ${GREEN}✓${NC} .claude/review/${filename}\n${GREY}└${NC}\n`,
      )
      process.stdout.write(`${filePath}\n`)
    })
}
