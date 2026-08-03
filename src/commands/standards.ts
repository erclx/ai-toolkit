import { join } from 'node:path'
import type { Command } from 'commander'
import { registerPassThroughVerbs } from '@/commands/pass-through'
import { PROJECT_ROOT } from '@/exec'
import { createStandardsAdapter, standardsSourceDir } from '@/standards/adapter'
import { ALL_SELECTION, selectStandards } from '@/standards/closure'
import {
  refreshIndex,
  STANDARDS_REL,
  standardsInstallDir,
} from '@/standards/index-refresh'
import { applyInstall, planInstall } from '@/standards/install'
import { recordStamp, runDomainSync } from '@/sync/engine'
import { resolveTarget } from '@/target'
import {
  intro,
  logAdd,
  logError,
  logInfo,
  logStep,
  logWarn,
  outro,
  select,
} from '@/ui'

const GREEN = '\x1b[0;32m'
const GREY = '\x1b[0;90m'
const NC = '\x1b[0m'

interface InstallOptions {
  /** Always present: the option falls back to `ALL_SELECTION`. */
  readonly only: string
}

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
    .description('Copy standards into a project (overwrites)')
    .argument('[target]', 'Target directory', '.')
    .option(
      '--only <names>',
      "Comma-separated standard names, or 'all'",
      ALL_SELECTION,
    )
    .helpOption('-h, --help', 'Show this help message')
    .addHelpText(
      'after',
      [
        '',
        'A selection expands to the standards it cites, so nothing lands with',
        'a dangling reference.',
        '',
        'Examples:',
        '  aitk standards install',
        '  aitk standards install --only slug ../my-app',
        '  aitk standards install --only design,wireframes ../my-app',
        '',
      ].join('\n'),
    )
    .action(async (target: string, options: InstallOptions) => {
      process.exitCode = await runInstall(target, options.only)
    })

  registerPassThroughVerbs(standards, 'standards', ['list'])
}

async function runInstall(target: string, selection: string): Promise<number> {
  intro('aitk standards')

  const resolved = resolveTarget(target, PROJECT_ROOT)
  if (typeof resolved === 'number') return resolved

  const sourceDir = standardsSourceDir(PROJECT_ROOT)
  const destDir = standardsInstallDir(resolved)

  logStep('Scanning standards')
  const available = planInstall(sourceDir)
  const result = selectStandards(available, selection)

  if (!result.ok) {
    logError(
      `Standard not found: ${result.unknown.join(', ')}. Run 'aitk standards list' for the catalog.`,
    )
    outro()
    return 1
  }

  const { files, requested, added, unresolved } = result.selection
  for (const name of requested) logInfo(join(STANDARDS_REL, name))

  if (added.length > 0) {
    logStep(`Added by citation (${added.length})`)
    for (const name of added) logInfo(join(STANDARDS_REL, name))
  }

  if (unresolved.length > 0) {
    logStep(`Scope handoffs not installed (${unresolved.length})`)
    for (const name of unresolved) logWarn(name)
    logInfo('Each names a concern these standards do not govern. Add a name')
    logInfo('to --only if the project needs that standard as well.')
  }

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
