import { resolve } from 'node:path'
import type { Command } from 'commander'
import { ensureYtDlp, fetchOne } from '@/transcripts/fetch'
import { palette } from '@/ui'

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
      const { GREEN, GREY, NC, RED, WHITE } = palette(process.stderr)
      process.stderr.write(
        `${GREY}┌${NC}\n${GREY}│${NC} ${WHITE}canon transcripts${NC}\n`,
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
        process.exitCode = 1
      }
    })
}
