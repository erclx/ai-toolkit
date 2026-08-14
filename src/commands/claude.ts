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
import {
  auditExitCode,
  auditSkills,
  CORPORA,
  DESCRIPTION_LIMIT,
  REQUIREMENT_SECTIONS,
  type SkillFinding,
  type SkillsAudit,
} from '@/claude/skills-audit'
import { type DriftReport, readDrift } from '@/claude/skills-drift'
import { listSkills } from '@/claude/skills-list'
import {
  planSettings,
  readSettings,
  serializeSettings,
  writeSettings,
} from '@/claude/settings'
import { copyPreservingMode } from '@/copy'
import { execScript } from '@/exec'
import { PROJECT_ROOT } from '@/project-root'
import { isDirectory, resolveTarget } from '@/target'
import { injectGitignore, pruneGitignore } from '@/tooling/inject'
import {
  frameError,
  intro,
  isNonInteractive,
  logAdd,
  logError,
  logInfo,
  logStep,
  logWarn,
  outro,
  pipeOutput,
  plural,
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

interface SkillsAuditOptions {
  readonly json?: boolean
  readonly requirementsOnly?: boolean
}

interface SkillsDriftOptions {
  readonly json?: boolean
}

const SEEDED_FILES: readonly string[] = [
  'ARCHITECTURE.md',
  'REQUIREMENTS.md',
  'DESIGN.md',
]
const SEEDED_DIRS: readonly string[] = ['memory', 'tasks', 'wireframes']
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
    .description('Plugin skill catalog (list, audit, drift)')
    .argument('[subcommand]', "One of 'list', 'audit', or 'drift'")
    .helpOption('-h, --help', 'Show this help message')
    .action((subcommand: string | undefined) => {
      intro('aitk claude')
      logError(
        subcommand === undefined
          ? "Missing subcommand. Use 'list', 'audit', or 'drift'."
          : `Unknown subcommand: ${subcommand}. Use 'list', 'audit', or 'drift'.`,
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

  skills
    .command('audit')
    .description(
      'Report both skill corpora against the mechanical rules in standards/skill.md',
    )
    .argument('[path]', 'Project root, defaulting to the current directory')
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .option(
      '--requirements-only',
      'Run the gating requirement-presence check alone',
    )
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  the audit completed with every skill carrying a requirement',
        '  1  refused, with the reason on stderr',
        '  2  a skill folder carries no REQUIREMENT.md',
        '',
        'Only a missing REQUIREMENT.md sets a failing exit code. Name, description,',
        'folder, and requirement-section findings are advisory.',
        '',
        'Examples:',
        '  aitk claude skills audit',
        '  aitk claude skills audit --json',
        '  aitk claude skills audit --requirements-only',
        '',
      ].join('\n'),
    )
    .action(async (path: string | undefined, opts: SkillsAuditOptions) => {
      process.exitCode = await runSkillsAudit(path, opts)
    })

  skills
    .command('drift')
    .description('Name the shipped skill bodies rewritten since a given ref')
    .argument('<ref>', 'The commit a session started from')
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  history was read, whether or not a body moved',
        '  1  the question could not be answered, with the reason on stderr',
        '',
        'A moved body means the file changed, not that a session holds a stale',
        'copy. Passing a ref older than the oldest load over-reports, which is',
        'the safe direction. Confirm a name by reading the body.',
        '',
        'Examples:',
        '  aitk claude skills drift HEAD~20',
        '  aitk claude skills drift 02d7b265 --json',
        '',
      ].join('\n'),
    )
    .action((ref: string, opts: SkillsDriftOptions) => {
      process.exitCode = runSkillsDrift(ref, opts)
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

/**
 * Measures the cwd for the same reason the audit does, and takes the ref as a
 * required argument with no default. `HEAD` would be the only defensible one and
 * it answers every run with nothing moved, which is the silence this reports
 * against.
 */
function runSkillsDrift(ref: string, opts: SkillsDriftOptions): number {
  const root = process.cwd()
  const report = readDrift(root, ref)

  if (report.kind === 'measured') {
    intro('aitk claude skills drift')
    reportDrift(report, ref)
    outro()
  } else {
    frameError(report.reason)
  }

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify(
        report.kind === 'measured'
          ? {
              root,
              ref,
              base: report.base,
              head: report.head,
              moved: report.moved,
            }
          : { root, ref, unreadable: report.reason },
      )}\n`,
    )
  }

  return report.kind === 'measured' ? 0 : 1
}

/**
 * States the bound on every run, including the run that names nothing. A report
 * listing only what moved reads as a verdict on what a session holds, and the
 * command has no access to that.
 */
function reportDrift(
  report: Extract<DriftReport, { kind: 'measured' }>,
  ref: string,
): void {
  logStep('Range')
  logInfo(`${ref} to HEAD, resolved as ${report.base}..${report.head}.`)
  logInfo(
    'A body here changed on disk. Whether a session still holds the old one is what reading it settles.',
  )

  logStep('Moved bodies')
  if (report.moved.length === 0) {
    logInfo('No shipped body changed in this range.')
    return
  }

  const count = report.moved.length
  logWarn(
    `${count} skill ${count === 1 ? 'body' : 'bodies'} rewritten since ${ref}`,
  )
  pipeOutput(
    report.moved
      .map((moved) => `${moved.name}  ${moved.commit.slice(0, 8)}`)
      .join('\n'),
  )
}

/**
 * Measures the tree at the cwd rather than the toolkit root the catalog reads,
 * so a linked worktree audits its own branch instead of reporting on `main`. A
 * target carrying `.claude/skills/` alone is in scope for the same reason.
 */
async function runSkillsAudit(
  path: string | undefined,
  opts: SkillsAuditOptions,
): Promise<number> {
  const root = resolve(path ?? process.cwd())
  const gateOnly = opts.requirementsOnly ?? false
  const report = await auditSkills(root)

  if (report.corpora.length === 0) {
    return refuseAudit(
      `No skill corpus under ${root}. Looked for ${CORPORA.join(' and ')}.`,
      gateOnly,
    )
  }

  if (gateOnly) {
    reportRequirementGate(report)
  } else {
    intro('aitk claude skills audit')
    reportScope(report)
    reportRequirements(report)
    reportFrontmatter(report)
    reportFolder(report)
    reportRequirementShape(report)
    reportUnmeasured()
    outro()
  }

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify({
        root,
        corpora: report.corpora.map((corpus) => ({
          path: corpus.rel,
          skills: corpus.skills,
        })),
        skills: report.skills,
        findings: {
          missingRequirement: report.missingRequirement,
          nameMismatch: report.nameMismatch,
          missingDescription: report.missingDescription,
          longDescription: report.longDescription,
          readme: report.readme,
          folderName: report.folderName,
          requirementSections: report.requirementSections,
        },
        checkpoints: {
          descriptionLimit: DESCRIPTION_LIMIT,
          requirementSections: REQUIREMENT_SECTIONS,
          corpora: CORPORA,
        },
      })}\n`,
    )
  }

  return auditExitCode(report)
}

function refuseAudit(message: string, gateOnly: boolean): number {
  if (gateOnly) {
    frameError(message)
    return 1
  }

  intro('aitk claude skills audit')
  logStep('Refused')
  logWarn(message)
  outro()
  return 1
}

/**
 * Prints nothing when every skill carries a requirement.
 *
 * `--requirements-only` is what `verify.sh` runs on every push, and that script
 * pipes a stage's whole output into its own frame. A passing gate that printed
 * its frame would nest one inside the other on every contributor's push.
 */
function reportRequirementGate(report: SkillsAudit): void {
  const missing = report.missingRequirement
  if (missing.length === 0) return

  intro('aitk claude skills audit')
  logError(
    missing.length === 1
      ? '1 skill folder carries no REQUIREMENT.md'
      : `${missing.length} skill folders carry no REQUIREMENT.md`,
  )
  pipeOutput(missing.join('\n'))
  outro()
}

function reportFindings(findings: readonly SkillFinding[]): void {
  pipeOutput(
    findings.map((found) => `${found.rel}  ${found.detail}`).join('\n'),
  )
}

/**
 * Names each corpus that resolved, since a corpus the tree does not carry is
 * skipped silently and a count taken over one of the two reads as the whole.
 */
function reportScope(report: SkillsAudit): void {
  logStep('Scope')
  for (const corpus of report.corpora) {
    logInfo(`${corpus.rel}: ${plural(corpus.skills, 'skill')}`)
  }
}

function reportRequirements(report: SkillsAudit): void {
  logStep('Requirements')
  logInfo('Every skill folder carries REQUIREMENT.md beside SKILL.md.')
  logInfo('This is the only measure here that fails a run.')

  if (report.missingRequirement.length === 0) {
    logInfo('Every skill carries one.')
    return
  }

  logWarn(`${plural(report.missingRequirement.length, 'skill')} without one`)
  pipeOutput(report.missingRequirement.join('\n'))
}

function reportFrontmatter(report: SkillsAudit): void {
  logStep('Frontmatter')
  logInfo(
    `name matches the folder, and description is present and under ${DESCRIPTION_LIMIT} characters.`,
  )
  logInfo('A body whose frontmatter does not parse reads as declaring neither.')

  const findings =
    report.nameMismatch.length +
    report.missingDescription.length +
    report.longDescription.length
  if (findings === 0) {
    logInfo('Every body declares both fields.')
    return
  }

  if (report.nameMismatch.length > 0) {
    logWarn(
      `${plural(report.nameMismatch.length, 'body')} whose name does not match its folder`,
    )
    reportFindings(report.nameMismatch)
  }

  if (report.missingDescription.length > 0) {
    logWarn(
      `${plural(report.missingDescription.length, 'body')} without a description`,
    )
    pipeOutput(report.missingDescription.join('\n'))
  }

  if (report.longDescription.length > 0) {
    logWarn(
      `${plural(report.longDescription.length, 'description')} past the ${DESCRIPTION_LIMIT}-character ceiling`,
    )
    reportFindings(report.longDescription)
  }
}

function reportFolder(report: SkillsAudit): void {
  logStep('Folder')
  logInfo(
    'No README.md inside a skill folder, and a folder name in kebab-case carrying no capital or underscore.',
  )

  if (report.readme.length === 0 && report.folderName.length === 0) {
    logInfo('Every folder conforms.')
    return
  }

  if (report.readme.length > 0) {
    logWarn(`${plural(report.readme.length, 'folder')} carrying a README.md`)
    pipeOutput(report.readme.join('\n'))
  }

  if (report.folderName.length > 0) {
    logWarn(
      `${plural(report.folderName.length, 'folder name')} outside kebab-case`,
    )
    pipeOutput(report.folderName.join('\n'))
  }
}

function reportRequirementShape(report: SkillsAudit): void {
  logStep('Requirement shape')
  logInfo(
    `Each REQUIREMENT.md declares ${REQUIREMENT_SECTIONS.join(' and ')}, matched at any heading level.`,
  )
  logInfo(
    'A folder carrying no requirement is reported above rather than counted twice here.',
  )

  if (report.requirementSections.length === 0) {
    logInfo('Every requirement declares both.')
    return
  }

  logWarn(
    `${plural(report.requirementSections.length, 'requirement')} short a declared section`,
  )
  reportFindings(report.requirementSections)
}

/**
 * Stated on every run, including the run where everything above passed. A
 * report that lists only what it measured reads as a verdict on the standard
 * rather than on the half of it a parser can reach.
 */
function reportUnmeasured(): void {
  logStep('Unmeasured')
  logInfo(
    'The standard states rules no parser reads, and a pass above says nothing about them.',
  )
  logInfo(
    'Whether each Must traces to a stated gap, whether a gap reads as an observed failure rather than an intent, and whether a description routes.',
  )
  logInfo(
    'The 150-line body checkpoint is mechanical and still absent here, and it would print a count rather than a defect.',
  )
}
