import { existsSync } from 'node:fs'
import { chmod, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import type { Command } from 'commander'
import { claudeChain, pendingEntries, planGitignore } from '@/claude/gitignore'
import {
  applySeeds,
  countByScope,
  pendingSeeds,
  planSeeds,
  type Seed,
} from '@/claude/seeds'
import { listSeeds, readSeedContents } from '@/claude/seeds-list'
import { listSkills } from '@/claude/skills-list'
import {
  planSettings,
  readSettings,
  serializeSettings,
  writeSettings,
} from '@/claude/settings'
import { copyPreservingMode } from '@/copy'
import { execScript, PROJECT_ROOT } from '@/exec'
import { isDirectory, resolveTarget } from '@/target'
import { injectGitignore, pruneGitignore } from '@/tooling/inject'
import {
  intro,
  isNonInteractive,
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

interface SeedsListOptions {
  readonly json?: boolean
  readonly names?: boolean
}

interface SkillsListOptions {
  readonly json?: boolean
  readonly names?: boolean
}

const SEEDED_FILES: readonly string[] = [
  'ARCHITECTURE.md',
  'REQUIREMENTS.md',
  'DESIGN.md',
]
const SEEDED_DIRS: readonly string[] = ['tasks', 'wireframes']
const USER_DIR = join('tooling', 'claude', 'user')
const STATUSLINE = 'statusline-command.sh'

export function register(program: Command): void {
  const claude = program
    .command('claude')
    .description('Claude workflow (init, seeds, sync, setup)')
    .helpOption('-h, --help', 'Show this help message')
    .addHelpText(
      'after',
      [
        '',
        'Examples:',
        '  aitk claude init',
        '  aitk claude seeds list --json',
        '  aitk claude sync ../my-app',
        '',
      ].join('\n'),
    )

  claude
    .command('init')
    .description('Seed .claude/ workflow docs into a project')
    .argument('[target]', 'Target directory', '.')
    .helpOption('-h, --help', 'Show this help message')
    .action(async (target: string) => {
      process.exitCode = await runInit(target)
    })

  claude
    .command('sync')
    .description('Reconcile .gitignore against the claude manifest')
    .argument('[target]', 'Target directory', '.')
    .helpOption('-h, --help', 'Show this help message')
    .action(async (target: string) => {
      process.exitCode = await runSync(target)
    })

  claude
    .command('setup')
    .description('One-shot user-level config (statusline, attribution)')
    .argument('[dest]', 'User config directory', join(homedir(), '.claude'))
    .helpOption('-h, --help', 'Show this help message')
    .action(async (dest: string) => {
      process.exitCode = await runSetup(dest)
    })

  const seeds = claude
    .command('seeds')
    .description('Seed doc sources (list)')
    .argument('[subcommand]', "Only 'list' is supported")
    .helpOption('-h, --help', 'Show this help message')
    .action((subcommand: string | undefined) => {
      intro('aitk claude')
      logError(
        subcommand === undefined
          ? "Missing subcommand. Use 'list'."
          : `Unknown subcommand: ${subcommand}. Use 'list'.`,
      )
      outro()
      process.exitCode = 1
    })

  seeds
    .command('list')
    .description('List toolkit seed docs as installed by aitk claude init')
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Emit JSON with name, source, target, content')
    .option('--names', 'Only list target paths, one per line')
    .addHelpText(
      'after',
      [
        '',
        'Notes:',
        '  JSON is intended for skills that audit drift in target projects.',
        '',
      ].join('\n'),
    )
    .action(async (opts: SeedsListOptions) => {
      process.exitCode = await runSeedsList(opts)
    })

  const skills = claude
    .command('skills')
    .description('Plugin skill catalog (list)')
    .argument('[subcommand]', "Only 'list' is supported")
    .helpOption('-h, --help', 'Show this help message')
    .action((subcommand: string | undefined) => {
      intro('aitk claude')
      logError(
        subcommand === undefined
          ? "Missing subcommand. Use 'list'."
          : `Unknown subcommand: ${subcommand}. Use 'list'.`,
      )
      outro()
      process.exitCode = 1
    })

  skills
    .command('list')
    .description('List the plugin skills shipped under claude/skills/')
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Emit JSON with name and description')
    .option('--names', 'Only list skill names, one per line')
    .addHelpText(
      'after',
      [
        '',
        'Notes:',
        '  Internal skills under .claude/skills/ are excluded, since they',
        '  never install into a target project.',
        '',
      ].join('\n'),
    )
    .action((opts: SkillsListOptions) => {
      process.exitCode = runSkillsList(opts)
    })
}

function succeed(message: string): number {
  outro()
  process.stderr.write(`${GREEN}✓ ${message}${NC}\n`)
  return 0
}

async function runInit(target: string): Promise<number> {
  intro('aitk claude')

  const resolved = resolveTarget(target, PROJECT_ROOT)
  if (typeof resolved === 'number') return resolved

  logStep('Scanning .claude/')
  const seedEntries = planSeeds(PROJECT_ROOT, resolved)
  for (const entry of seedEntries) {
    if (entry.present) logInfo(entry.seed.scanLabel)
    else logAdd(entry.seed.scanLabel)
  }
  const seeds = pendingSeeds(seedEntries)

  logStep('Scanning .gitignore')
  const chain = claudeChain(PROJECT_ROOT)
  const gitignoreEntries = planGitignore(chain, resolved)
  for (const entry of gitignoreEntries) {
    if (entry.present) logInfo(entry.entry)
    else logAdd(entry.entry)
  }
  const missing = pendingEntries(gitignoreEntries)

  const total = seeds.length + missing.length
  if (total === 0) return succeed('Claude already initialized')

  const shouldApply = await select({
    message: `Apply ${total} change(s) (${summarize(seeds, missing.length)})?`,
    options: [
      { value: true, label: 'Apply all' },
      { value: false, label: 'Cancel' },
    ],
    nonInteractiveDefault: true,
  })

  if (!shouldApply) {
    logWarn('Cancelled')
    outro()
    return 0
  }

  logStep('Applying changes')
  for (const label of await applySeeds(seeds)) logAdd(label)
  if (missing.length > 0) await injectGitignore(chain, resolved)

  return succeed('Claude ready')
}

function summarize(seeds: readonly Seed[], gitignoreCount: number): string {
  const counts = countByScope(seeds)
  const parts: string[] = []
  if (counts.claude > 0) parts.push(`${counts.claude} .claude`)
  if (counts.root > 0) parts.push(`${counts.root} CLAUDE.md`)
  if (gitignoreCount > 0) parts.push(`${gitignoreCount} .gitignore`)
  return parts.join(', ')
}

async function runSync(target: string): Promise<number> {
  intro('aitk claude')

  const resolved = resolveTarget(target, PROJECT_ROOT)
  if (typeof resolved === 'number') return resolved

  logStep('Seeded')
  for (const name of SEEDED_FILES) {
    if (existsSync(join(resolved, '.claude', name))) logInfo(name)
    else logWarn(`${name} missing. Run \`aitk claude init\``)
  }
  for (const name of SEEDED_DIRS) {
    if (isDirectory(join(resolved, '.claude', name))) logInfo(`${name}/`)
    else logWarn(`${name}/ missing. Run \`aitk claude init\``)
  }

  logStep('Scanning .gitignore')
  const chain = claudeChain(PROJECT_ROOT)
  const pruned = await pruneGitignore(chain, resolved)
  const gitignoreEntries = planGitignore(chain, resolved)
  for (const entry of gitignoreEntries) {
    if (entry.present) logInfo(entry.entry)
    else logAdd(entry.entry)
  }
  const missing = pendingEntries(gitignoreEntries)

  if (missing.length === 0 && pruned.length === 0) {
    return succeed('Claude workflow up to date')
  }

  if (missing.length > 0) {
    if (isNonInteractive()) {
      logInfo(`Applying ${missing.length} update(s) (non-interactive)`)
    } else {
      const shouldApply = await select({
        message: `Apply ${missing.length} update(s) (${missing.length} .gitignore)?`,
        options: [
          { value: true, label: 'Apply all' },
          { value: false, label: 'Cancel' },
        ],
      })

      if (!shouldApply) {
        logWarn('Cancelled')
        outro()
        return 0
      }
    }

    logStep('Applying changes')
    await injectGitignore(chain, resolved)
  }

  return succeed('Claude workflow synced')
}

/**
 * Writes to the operator's own machine rather than a project, so the
 * destination is a parameter. That lets a test cover the merge without
 * pointing it at a real home directory.
 */
async function runSetup(dest: string): Promise<number> {
  intro('aitk claude')

  const resolved = resolve(dest)
  if (resolved === join(PROJECT_ROOT, '.claude')) {
    logError(
      'Cannot run against the toolkit .claude/. Files here are the source of truth.',
    )
    outro()
    return 1
  }

  const userDir = join(PROJECT_ROOT, USER_DIR)
  const scriptSrc = join(userDir, STATUSLINE)
  const scriptDest = join(resolved, STATUSLINE)
  const settingsPath = join(resolved, 'settings.json')

  logStep('Statusline script')
  if (await sameContent(scriptSrc, scriptDest)) {
    logInfo(STATUSLINE)
  } else {
    await copyPreservingMode(scriptSrc, scriptDest)
    await chmod(scriptDest, 0o755)
    logAdd(STATUSLINE)
  }

  logStep('Settings')
  const template = await readSettings(join(userDir, 'settings.template.json'))

  let current: Awaited<ReturnType<typeof readSettings>>
  try {
    current = await readSettings(settingsPath)
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error))
    logError('Fix the file by hand, or move it aside and rerun.')
    outro()
    return 1
  }

  const { value, indent } = current
  const plan = planSettings(value, template.value, `bash ${scriptDest}`)

  for (const key of plan.keys) {
    if (key.changed) logAdd(key.label)
    else logInfo(key.label)
  }

  if (plan.changed) {
    await writeSettings(settingsPath, serializeSettings(plan.next, indent))
  }

  return succeed('Claude user config ready')
}

async function sameContent(src: string, dest: string): Promise<boolean> {
  if (!existsSync(dest)) return false
  const [left, right] = await Promise.all([
    readFile(src, 'utf8'),
    readFile(dest, 'utf8'),
  ])
  return left === right
}

/**
 * `--json` and `--names` write to stdout so a skill can pipe them, while the
 * human listing stays on the timeline. Only the human mode opens a frame.
 */
async function runSeedsList(opts: SeedsListOptions): Promise<number> {
  const listings = listSeeds(PROJECT_ROOT)

  if (opts.json) {
    const withContent = await readSeedContents(listings)
    process.stdout.write(`${JSON.stringify(withContent)}\n`)
    return 0
  }

  if (opts.names) {
    process.stdout.write(
      listings.map((listing) => listing.target).join('\n') + '\n',
    )
    return 0
  }

  intro('aitk claude')
  logStep('Seed docs')
  for (const listing of listings) {
    logInfo(`${listing.target} ${GREY}← ${listing.source}${NC}`)
  }
  outro()
  return 0
}

function runSkillsList(opts: SkillsListOptions): number {
  const listings = listSkills(PROJECT_ROOT)

  if (opts.json) {
    process.stdout.write(`${JSON.stringify({ skills: listings })}\n`)
    return 0
  }

  if (opts.names) {
    process.stdout.write(
      listings.map((listing) => listing.name).join('\n') + '\n',
    )
    return 0
  }

  intro('aitk claude')
  logStep('Plugin skills')
  for (const listing of listings) {
    logInfo(listing.name)
  }
  outro()
  return 0
}
