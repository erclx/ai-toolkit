import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Command } from 'commander'
import { cliPath, cliRun } from '@/cli-run'
import { PROJECT_ROOT } from '@/exec'
import { buildCheckReport, type CheckReport, hasDrift } from '@/sync/check'
import { createGitRunner, createPullRequestOpener, hasGh } from '@/sync/git'
import { STAMP_DOMAINS } from '@/sync/stamp'
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

interface SyncOptions {
  readonly check?: boolean
  readonly json?: boolean
  readonly exitCode?: boolean
}

export function register(program: Command): void {
  program
    .command('sync')
    .description('Sync all installed domains in a project')
    .argument('[target]', 'Target directory', '.')
    .option('--check', 'Report drift without writing anything')
    .option('--json', 'Emit the drift report as JSON on stdout')
    .option('--exit-code', 'Exit 1 when drift is found, for CI')
    .helpOption('-h, --help', 'Show this help message')
    .addHelpText(
      'after',
      [
        '',
        'Examples:',
        '  aitk sync',
        '  aitk sync ../my-app',
        '  aitk sync --check',
        '  aitk sync --check --json',
        '  aitk sync --check --exit-code',
        '',
      ].join('\n'),
    )
    .action(async (target: string, options: SyncOptions) => {
      process.exitCode =
        options.check === true
          ? await runCheck(target, options)
          : await runSync(target)
    })
}

/**
 * Reads the same plan a sync would apply and writes nothing. Drift between
 * syncs is normal, so the default exit stays 0 and CI opts into failing.
 */
async function runCheck(target: string, options: SyncOptions): Promise<number> {
  const resolved = resolveTarget(target, PROJECT_ROOT)
  if (typeof resolved === 'number') return resolved

  const report = await buildCheckReport(PROJECT_ROOT, resolved)

  if (options.json === true) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  } else {
    renderCheck(report)
  }

  return options.exitCode === true && hasDrift(report) ? 1 : 0
}

function renderCheck(report: CheckReport): void {
  intro('aitk sync --check')

  for (const domain of report.domains) {
    logStep(domain.domain)

    if (domain.commit === undefined) {
      logWarn(
        domain.historyUnavailable
          ? 'Not stamped, and this toolkit has no git history. Drift below is reported unattributed.'
          : 'Not stamped. Drift below is attributed from toolkit history.',
      )
    } else {
      logInfo(`Synced from ${domain.commit} on ${domain.syncedAt}`)
    }

    for (const entry of domain.entries) {
      if (entry.state === 'matching' || entry.state === 'orphaned') continue
      logWarn(`${entry.rel} (${entry.state})`)
    }

    const { stale, customized, drifted, stranded, orphaned } = domain.counts
    if (stale + customized + drifted + stranded === 0) {
      logInfo(orphaned === 0 ? 'up to date' : `up to date (${orphaned} local)`)
    }

    for (const commit of domain.upstream) {
      logInfo(`${commit.sha} ${commit.subject}`)
    }
  }

  for (const entry of report.unmigrated) {
    logStep(`${entry.domain} (not migrated)`)
    logWarn(
      `${entry.files} files at ${entry.rootPath}/, nothing at ${entry.installPath}/`,
    )
    logInfo('Run /aitk:migration-standards to relocate them.')
  }

  renderSeeds(report)

  if (report.superseded.length > 0) {
    logStep('Superseded by a newer layout')
    for (const entry of report.superseded) {
      logWarn(`${entry.rel} (replaced by ${entry.replacedBy}/)`)
    }
    logInfo('Move the content yourself. No sync command touches these.')
  }

  if (report.newSkills.length > 0) {
    logStep('New skills, no sync needed')
    for (const name of report.newSkills) logInfo(name)
  }

  outro()
  const unmigrated = report.unmigrated.map((entry) => entry.domain)
  const uncovered = STAMP_DOMAINS.filter(
    (domain) => !report.covers.includes(domain) && !unmigrated.includes(domain),
  )
  const unstamped =
    uncovered.length === 0 ? '' : `Unstamped: ${uncovered.join(', ')}. `
  process.stderr.write(
    `${GREY}${unstamped}Tooling is never stamped, run \`aitk tooling\` to reconcile configs.${NC}\n`,
  )
}

/**
 * Seeds print their own section because no sync command applies them. A `stale`
 * seed is safe to take whole and a `drifted` one holds edits, which is the split
 * `claude-seed-sync` reads to decide what needs a section-level merge.
 */
function renderSeeds(report: CheckReport): void {
  const notable = report.seeds.entries.filter(
    (entry) => entry.state !== 'matching',
  )

  if (notable.length === 0) return

  logStep('seeds')
  if (report.seeds.historyUnavailable) {
    logWarn('This toolkit has no git history. Drift below is unattributed.')
  }

  for (const entry of notable) {
    logWarn(`${entry.rel} (${entry.state})`)
  }

  logInfo('Run /aitk:claude-seed-sync to reconcile these section by section.')
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
