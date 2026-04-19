import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Command } from 'commander'
import { renderDesignDoc } from '@/design/render'

const GREY = '\x1b[0;90m'
const WHITE = '\x1b[1;37m'
const RED = '\x1b[0;31m'
const GREEN = '\x1b[0;32m'
const NC = '\x1b[0m'

export function register(program: Command): void {
  const design = program
    .command('design')
    .description('Design system commands (render)')

  design
    .command('render')
    .description('Render DESIGN.md tokens to HTML and CSS preview')
    .option('-s, --source <path>', 'Source DESIGN.md path', '.claude/DESIGN.md')
    .option('-o, --out <path>', 'Output directory', '.claude/review/design')
    .action((opts: { source: string; out: string }) => {
      const sourcePath = resolve(process.cwd(), opts.source)
      const outDir = resolve(process.cwd(), opts.out)
      if (!existsSync(sourcePath)) {
        process.stderr.write(
          `${GREY}┌${NC}\n${GREY}│${NC} ${RED}✗${NC} ${opts.source} not found\n${GREY}└${NC}\n`,
        )
        process.exit(1)
      }
      process.stderr.write(
        `${GREY}┌${NC}\n${GREY}│${NC} ${WHITE}Render design tokens${NC}\n`,
      )
      const result = renderDesignDoc(sourcePath, outDir)
      process.stderr.write(
        `${GREY}│${NC} ${GREEN}✓${NC} ${result.htmlPath}\n${GREY}│${NC} ${GREEN}✓${NC} ${result.cssPath}\n${GREY}└${NC}\n`,
      )
    })
}
