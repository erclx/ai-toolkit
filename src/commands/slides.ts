import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Command } from 'commander'
import { LAYOUTS } from '@/slides/layouts'
import { openDeck } from '@/slides/open'
import { renderSlidesDoc } from '@/slides/render'
import type { Variant } from '@/slides/styles'
import { intro, outro } from '@/ui'

const GREY = '\x1b[0;90m'
const GREEN = '\x1b[0;32m'
const RED = '\x1b[0;31m'
const NC = '\x1b[0m'

export function register(program: Command): void {
  const slides = program
    .command('slides')
    .description('Slide deck commands (render, list)')

  slides
    .command('render')
    .description('Render a SLIDES.md source into a PowerPoint deck')
    .option('-s, --source <path>', 'Source SLIDES.md path', '.claude/SLIDES.md')
    .option('-o, --out <path>', 'Output directory', '.claude/review/slides')
    .option('-v, --variant <variant>', 'Override variant (light or dark)')
    .option(
      '-m, --mirror <path>',
      'Copy the deck to this directory after writing',
    )
    .option('--open', 'Open the deck after writing')
    .action(
      async (opts: {
        source: string
        out: string
        variant?: string
        mirror?: string
        open?: boolean
      }) => {
        const sourcePath = resolve(process.cwd(), opts.source)
        const outDir = resolve(process.cwd(), opts.out)
        if (!existsSync(sourcePath)) {
          fail(`${opts.source} not found`)
        }
        const variant = parseVariant(opts.variant)
        const mirror = resolveMirror(opts.mirror)
        intro('Render slides')
        const result = await renderSlidesDoc(sourcePath, outDir, {
          variant,
          mirror,
        })
        process.stderr.write(
          `${GREY}│${NC} ${GREEN}✓${NC} ${result.slideCount} slides\n${GREY}│${NC} ${GREEN}✓${NC} ${result.pptxPath}\n`,
        )
        if (result.mirrorPath) {
          process.stderr.write(
            `${GREY}│${NC} ${GREEN}✓${NC} mirrored to ${result.mirrorPath}\n`,
          )
        }
        if (opts.open) {
          const target = result.mirrorPath ?? result.pptxPath
          const opened = await openDeck(target)
          const mark = opened ? `${GREEN}✓${NC}` : `${RED}✗${NC}`
          process.stderr.write(
            `${GREY}│${NC} ${mark} ${opened ? 'opened' : 'could not open'} ${target}\n`,
          )
        }
        outro()
      },
    )

  slides
    .command('list')
    .description('List the available slide layouts')
    .option('--json', 'Output the layout catalog as JSON')
    .action((opts: { json?: boolean }) => {
      if (opts.json) {
        process.stdout.write(`${JSON.stringify(LAYOUTS)}\n`)
        return
      }
      intro('Slide layouts')
      for (const layout of LAYOUTS) {
        process.stderr.write(
          `${GREY}│${NC} ${GREEN}✓${NC} ${layout.name}  ${GREY}${layout.description}${NC}\n`,
        )
      }
      outro()
    })
}

function parseVariant(value: string | undefined): Variant | undefined {
  if (value === undefined) return undefined
  if (value === 'light' || value === 'dark') return value
  fail(`Invalid variant "${value}". Use light or dark.`)
}

function resolveMirror(value: string | undefined): string | undefined {
  const mirror = value ?? process.env.AITK_SLIDES_MIRROR
  return mirror ? resolve(process.cwd(), mirror) : undefined
}

function fail(message: string): never {
  process.stderr.write(
    `${GREY}┌${NC}\n${GREY}│${NC} ${RED}✗${NC} ${message}\n${GREY}└${NC}\n`,
  )
  process.exit(1)
}
