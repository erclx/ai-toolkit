import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Command } from 'commander'
import { cliPath, cliRun } from '@/cli-run'
import { PROJECT_ROOT } from '@/exec'
import { createGitRunner, createPullRequestOpener, hasGh } from '@/sync/git'
import {
  detectDomains,
  installedDomains,
  isTreeClean,
  shouldSync,
  SYNC_DOMAINS,
  type SyncDomain,
} from '@/sync/target'
import { runGitWorkflow } from '@/sync/workflow'
import { resolveTarget } from '@/target'
import {
  intro,
  isNonInteractive,
  logError,
  logInfo,
  logStep,
  logWarn,
  outro,
} from '@/ui'

const GREY = '\x1b[0;90m'
const YELLOW = '\x1b[0;33m'
const NC = '\x1b[0m'

const SYNC_ARGS: Record<SyncDomain, readonly string[]> = {
  standards: ['standards', 'sync'],
  snippets: ['snippets', 'sync'],
  governance: ['gov', 'sync'],
  claude: ['claude', 'sync'],
}

export function register(program: Command): void {
  program
    .command('sync')
    .description('Sync all installed domains in a project')
    .argument('[target]', 'Target directory', '.')
    .helpOption('-h, --help', 'Show this help message')
    .addHelpText(
      'after',
      ['', 'Examples:', '  aitk sync', '  aitk sync ../my-app', ''].join('\n'),
    )
    .action(async (target: string) => {
      process.exitCode = await runSync(target)
    })
}

async function runSync(target: string): Promise<number> {
  intro('aitk sync')

  const resolved = resolveTarget(target, PROJECT_ROOT)
  if (typeof resolved === 'number') return resolved

  const git = createGitRunner(resolved)

  logStep('Checking working tree')
  if (!isTreeClean(await git.status([]))) {
    logError(
      'Working tree has uncommitted changes. Commit or stash before syncing.',
    )
    outro()
    return 1
  }
  logInfo('Working tree clean')

  logStep('Detecting domains')
  const states = detectDomains(resolved)
  for (const state of states) {
    if (state.installed) logInfo(state.domain)
    else logWarn(`${state.domain} (not installed, skipping)`)
  }

  if (installedDomains(states).length === 0) {
    outro()
    process.stderr.write(
      `\n${YELLOW}! No domains installed in target. Run domain install commands first.${NC}\n`,
    )
    return 0
  }

  outro()
  process.stderr.write('\n')

  await runDomainSyncs(resolved)

  const code = await runGitWorkflow(resolved, {
    git,
    pullRequests: (await hasGh())
      ? createPullRequestOpener(resolved)
      : undefined,
    now: new Date(),
    nonInteractive: isNonInteractive(),
  })

  if (existsSync(join(resolved, '.claude'))) {
    process.stderr.write(
      `${GREY}Tip: run \`/claude-seed-sync\` to audit seed and standards drift per section, preserving local customizations.${NC}\n`,
    )
  }

  return code
}

/**
 * Each domain sync runs as its own process. They open their own frames and
 * prompt for their own changes, so stdin stays inherited. Claude is the one
 * exception: it runs headless because the combined pull request preview is the
 * single confirmation gate for the whole sync, and `aitk claude sync` writes
 * only `.gitignore`.
 */
async function runDomainSyncs(target: string): Promise<void> {
  const path = cliPath(PROJECT_ROOT)

  for (const domain of SYNC_DOMAINS) {
    if (!shouldSync(target, domain)) continue

    await cliRun(path, [...SYNC_ARGS[domain], target], {
      nonInteractive: domain === 'claude',
    })()
  }
}
