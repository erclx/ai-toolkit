import { resolve } from 'node:path'
import type { Command } from 'commander'
import { ensureYtDlp, fetchOne } from '@/transcripts/fetch'

const GREY = '\x1b[0;90m'
const WHITE = '\x1b[1;37m'
const RED = '\x1b[0;31m'
const GREEN = '\x1b[0;32m'
const NC = '\x1b[0m'

interface TranscriptOptions {
  out: string
  keepTimestamps?: boolean
}

export function register(program: Command): void {
  program
    .command('transcripts <url>')
    .description('Fetch a YouTube transcript with metadata frontmatter')
    .option('-o, --out <path>', 'Output directory', 'transcripts')
    .option(
      '--keep-timestamps',
      'Prefix each line with [mm:ss] instead of prose',
    )
    .action(async (url: string, opts: TranscriptOptions) => {
      const outDir = resolve(process.cwd(), opts.out)
      process.stderr.write(
        `${GREY}┌${NC}\n${GREY}│${NC} ${WHITE}aitk transcripts${NC}\n`,
      )
      try {
        ensureYtDlp()
        const target = await fetchOne(url, {
          outDir,
          keepTimestamps: opts.keepTimestamps ?? false,
        })
        process.stdout.write(`${target}\n`)
        process.stderr.write(
          `${GREY}│${NC} ${GREEN}✓${NC} ${target}\n${GREY}└${NC}\n`,
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        process.stderr.write(
          `${GREY}│${NC} ${RED}✗${NC} ${message}\n${GREY}└${NC}\n`,
        )
        process.exit(1)
      }
    })
}
