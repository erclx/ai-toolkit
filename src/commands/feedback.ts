import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Command } from 'commander'
import { execa } from 'execa'
import { deriveSlug, deriveTitle } from '@/commands/feedback-format'
import { PROJECT_ROOT } from '@/exec'

const GREY = '\x1b[0;90m'
const WHITE = '\x1b[1;37m'
const RED = '\x1b[0;31m'
const GREEN = '\x1b[0;32m'
const YELLOW = '\x1b[0;33m'
const NC = '\x1b[0m'

const GH_TIMEOUT_MS = 30_000

function frameError(message: string): void {
  process.stderr.write(
    `${GREY}┌${NC}\n${GREY}│${NC} ${RED}✗${NC} ${message}\n${GREY}└${NC}\n`,
  )
}

function frameSuccess(target: string): void {
  process.stderr.write(
    `${GREY}┌${NC}\n${GREY}│${NC} ${WHITE}aitk feedback${NC}\n${GREY}│${NC}\n${GREY}│${NC} ${GREEN}✓${NC} ${target}\n${GREY}└${NC}\n`,
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

function timestamp(): string {
  const d = new Date()
  const pad = (n: number): string => n.toString().padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function writeLocal(body: string): string {
  const reviewDir = join(PROJECT_ROOT, '.claude', 'review')
  mkdirSync(reviewDir, { recursive: true })
  const filename = `feedback-${deriveSlug(body)}-${timestamp()}.md`
  const filePath = join(reviewDir, filename)
  writeFileSync(filePath, `${body}\n`, 'utf8')
  frameSuccess(`.claude/review/${filename}`)
  return filePath
}

async function createIssue(body: string): Promise<string | null> {
  if (Bun.which('gh') === null) return null
  try {
    const result = await execa(
      'gh',
      ['issue', 'create', '--title', deriveTitle(body), '--body', body],
      { cwd: PROJECT_ROOT, timeout: GH_TIMEOUT_MS },
    )
    return result.stdout.trim() || null
  } catch {
    return null
  }
}

export function register(program: Command): void {
  program
    .command('feedback')
    .description(
      'Write toolkit feedback from stdin to .claude/review/, or open a GitHub issue with --github',
    )
    .option(
      '--github',
      'Open a GitHub issue on the toolkit repo instead of writing local scratch',
    )
    .action(async (opts: { github?: boolean }) => {
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

      if (opts.github) {
        const url = await createIssue(body)
        if (url) {
          frameSuccess(url)
          process.stdout.write(`${url}\n`)
          return
        }
        process.stderr.write(
          `${YELLOW}! gh unavailable, wrote local scratch instead${NC}\n`,
        )
      }

      const filePath = writeLocal(body)
      process.stdout.write(`${filePath}\n`)
    })
}
