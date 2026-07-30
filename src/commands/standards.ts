import { join } from 'node:path'
import type { Command } from 'commander'
import { registerPassThroughVerbs } from '@/commands/pass-through'
import { PROJECT_ROOT } from '@/exec'
import { createStandardsAdapter, standardsSourceDir } from '@/standards/adapter'
import {
  refreshIndex,
  STANDARDS_REL,
  standardsInstallDir,
} from '@/standards/index-refresh'
import { applyInstall, planInstall } from '@/standards/install'
import { recordStamp, runDomainSync } from '@/sync/engine'
import { resolveTarget } from '@/target'
import { intro, logAdd, logInfo, logStep, logWarn, outro, select } from '@/ui'

const GREEN = '\x1b[0;32m'
const GREY = '\x1b[0;90m'
const NC = '\x1b[0m'

export function register(program: Command): void {
  const standards = program
    .command('standards')
    .description('Standards commands (install, sync, list)')
    .helpOption('-h, --help', 'Show this help message')

  standards
    .command('sync')
    .description('Update standards already installed under .claude/standards/')
    .argument('[target]', 'Target directory', '.')
    .helpOption('-h, --help', 'Show this help message')
    .action(async (target: string) => {
      process.exitCode = await runDomainSync(
        createStandardsAdapter(PROJECT_ROOT),
        target,
        { protectedRoot: PROJECT_ROOT },
      )
    })

  standards
    .command('install')
    .description('Copy all standards into a project (overwrites)')
    .argument('[target]', 'Target directory', '.')
    .helpOption('-h, --help', 'Show this help message')
    .action(async (target: string) => {
      process.exitCode = await runInstall(target)
    })

  registerPassThroughVerbs(standards, 'standards', ['list'])
}

async function runInstall(target: string): Promise<number> {
  intro('aitk standards')

  const resolved = resolveTarget(target, PROJECT_ROOT)
  if (typeof resolved === 'number') return resolved

  const sourceDir = standardsSourceDir(PROJECT_ROOT)
  const destDir = standardsInstallDir(resolved)

  logStep('Scanning standards')
  const files = planInstall(sourceDir)
  for (const file of files) logInfo(join(STANDARDS_REL, file.name))

  const shouldInstall = await select({
    message: `Install ${files.length} standards to ${destDir}?`,
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' },
    ],
    nonInteractiveDefault: true,
  })

  if (!shouldInstall) {
    logWarn('Cancelled')
    outro()
    return 0
  }

  logStep('Installing standards')
  for (const label of await applyInstall(files, destDir)) logAdd(label)
  await refreshIndex(sourceDir, resolved)
  await recordStamp(createStandardsAdapter(PROJECT_ROOT), resolved, new Date())

  outro()
  process.stderr.write(
    `\n${GREEN}✓ Standards installed${NC} ${GREY}(${files.length} files)${NC}\n`,
  )
  return 0
}
