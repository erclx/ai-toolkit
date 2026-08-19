import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import type { Command } from 'commander'
import { PROJECT_ROOT } from '@/project-root'
import { createGovAdapter } from '@/gov/adapter'
import { regenConsumedRules } from '@/gov/consumed'
import { hasStandards, installRules, lookupRules } from '@/gov/install'
import { buildGovCatalog, describeRule, describeStack } from '@/gov/list'
import { buildRulesPayload, listRuleFiles } from '@/gov/payload'
import {
  govStackExists,
  listGovStacks,
  mergeExtraRules,
  resolveRules,
} from '@/gov/stacks'
import {
  type PairRecord,
  readTestOrder,
  type TestOrderReport,
} from '@/gov/test-order'
import { recordStamp, runDomainSync } from '@/sync/engine'
import { resolveTarget } from '@/target'
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
const NC = '\x1b[0m'

const PAYLOAD_REL = join('.claude', '.tmp', 'gov', 'rules.md')
const RULES_REL = join('.claude', 'rules')

interface InstallOptions {
  readonly add?: string
}

interface RegenOptions {
  readonly root?: string
}

interface ListOptions {
  readonly stacks?: boolean
  readonly rules?: boolean
  readonly json?: boolean
}

interface TestOrderOptions {
  readonly base?: string
  readonly root?: string
  readonly json?: boolean
}

export function register(program: Command): void {
  const gov = program
    .command('gov')
    .description('Governance commands (install, sync, build, list)')
    .helpOption('-h, --help', 'Show this help message')

  gov
    .command('install')
    .description('Install a governance stack into .claude/rules/')
    .argument('[stack]', 'Stack name (e.g. base, node, react)')
    .argument('[target]', 'Target directory', '.')
    .helpOption('-h, --help', 'Show this help message')
    .option('--add <rules>', 'Comma-separated rules to layer on the stack')
    .addHelpText(
      'after',
      [
        '',
        'Examples:',
        '  aitk gov install react',
        '  aitk gov install node ../my-app',
        '  aitk gov install astro --add 200-react,260-shadcn ../my-app',
        '',
      ].join('\n'),
    )
    .action(
      async (
        stack: string | undefined,
        target: string,
        opts: InstallOptions,
      ) => {
        process.exitCode = await runInstall(stack, target, opts)
      },
    )

  gov
    .command('sync')
    .description('Update rules already installed under .claude/rules/')
    .argument('[target]', 'Target directory', '.')
    .helpOption('-h, --help', 'Show this help message')
    .action(async (target: string) => {
      process.exitCode = await runDomainSync(
        createGovAdapter(PROJECT_ROOT),
        target,
        { protectedRoot: PROJECT_ROOT },
      )
    })

  gov
    .command('build')
    .description('Concatenate installed rules into .claude/.tmp/gov/rules.md')
    .argument('[target]', 'Target directory', '.')
    .helpOption('-h, --help', 'Show this help message')
    .action(async (target: string) => {
      process.exitCode = await runBuild(target)
    })

  gov
    .command('regen')
    .description("Rebuild a repository's own .claude/rules/ from its record")
    .helpOption('-h, --help', 'Show this help message')
    .option('--root <path>', 'Repository root to regenerate', PROJECT_ROOT)
    .addHelpText(
      'after',
      [
        '',
        'Reads internal/governance.toml and installs the stack it names, plus',
        'any rules under internal/rules/. Unlike install and sync, this runs',
        'against the toolkit root, whose .claude/rules/ is produced output.',
        '',
      ].join('\n'),
    )
    .action(async (opts: RegenOptions) => {
      process.exitCode = await runRegen(opts)
    })

  gov
    .command('list')
    .description('Emit the catalog of stacks and rules')
    .helpOption('-h, --help', 'Show this help message')
    .option('--stacks', 'Only list stacks')
    .option('--rules', 'Only list rules')
    .option('--json', 'Emit machine-readable JSON')
    .action((opts: ListOptions) => {
      process.exitCode = runList(opts)
    })

  gov
    .command('test-order')
    .description(
      'Report where an implementation reached history before its test',
    )
    .helpOption('-h, --help', 'Show this help message')
    .option('--base <ref>', 'Far side of the range, defaulting to the trunk')
    .option('--root <path>', 'Repository to read, defaulting to the cwd')
    .option('--json', 'Add a machine-readable record on stdout')
    .addHelpText(
      'after',
      [
        '',
        'Measures the rule in .claude/rules/core/070-planning.md that asks for',
        'the test before the code. It reports and never gates, because pairing',
        'a test to an implementation is a judgment.',
        '',
        'Coverage:',
        '  a test sits beside its subject under the same name, minus .test',
        '  only .ts and .tsx are paired, and every other path is named as read past',
        '  a module the range modified rather than added is unclassified, since',
        '  a refactor and a new behavior cannot be told apart from history',
        '',
        'Exit codes:',
        '  0  no implementation reached history ahead of its test',
        '  1  refused, with the reason on stderr or in the JSON record',
        '  2  at least one implementation reached history ahead of its test',
        '',
        'Examples:',
        '  aitk gov test-order',
        '  aitk gov test-order --base origin/main --json',
        '',
      ].join('\n'),
    )
    .action((opts: TestOrderOptions) => {
      process.exitCode = runTestOrder(opts)
    })
}

/**
 * Reports and never gates, so the finding count moves the exit code without
 * anything wiring it into a push. `aitk tasks validate` set that shape: a
 * measure carrying a known false-positive class is what forces contributors to
 * route around a stage, and the unclassified bucket here is that class.
 */
function runTestOrder(opts: TestOrderOptions): number {
  const root = resolve(opts.root ?? process.cwd())
  const report = readTestOrder(root, { base: opts.base })
  const emitJson = opts.json ?? false

  // The frame renders on stderr in both modes and the record goes to stdout
  // alone, which is the split `docs/agents/output-shape.md` fixes. A consumer
  // reading stdout sees pure data either way, and an operator reading the
  // terminal sees the refusal rather than a command that appeared to do nothing.
  if (report.kind === 'unreadable') {
    intro('aitk gov test-order')
    logStep('Refused')
    logError(report.reason)
    outro()

    if (emitJson) {
      process.stdout.write(
        `${JSON.stringify({ ok: false, reason: report.reason })}\n`,
      )
    }

    return 1
  }

  reportTestOrder(report, root)

  if (emitJson) {
    process.stdout.write(`${JSON.stringify({ ok: true, root, ...report })}\n`)
  }

  return report.findings.length > 0 ? 2 : 0
}

function describePair(record: PairRecord): string {
  const test = record.test === null ? 'no test' : record.test
  return `${record.subject} → ${test}: ${record.reason}`
}

function reportTestOrder(
  report: Extract<TestOrderReport, { kind: 'measured' }>,
  root: string,
): void {
  intro('aitk gov test-order')

  logStep('Range')
  logInfo(`${report.base.slice(0, 8)}..${report.head.slice(0, 8)} in ${root}`)

  logStep(report.findings.length === 0 ? 'Clean' : 'Findings')
  if (report.findings.length === 0) {
    logInfo('no implementation reached history ahead of the test covering it')
  } else {
    for (const finding of report.findings) logWarn(describePair(finding))
  }

  logStep('Satisfied')
  logInfo(`${report.satisfied.length} pair(s) whose test came first`)

  // The unclassified rows carry the warn glyph and move no exit code. A pass
  // over a change the pairing could not read is the claim this check exists to
  // avoid making, so the rows are named rather than counted into the clean line.
  logStep('Unclassified')
  if (report.unclassified.length === 0) {
    logInfo('every changed module paired')
  } else {
    logWarn(
      `${report.unclassified.length} change(s) the pairing could not read`,
    )
    for (const record of report.unclassified) logWarn(describePair(record))
  }

  // Coverage is narrower than the rule, and a report that did not say so would
  // read as a verdict over every behavior in the range.
  logStep('Read past')
  logInfo(
    `${report.ignored.length} path(s) outside ${report.scope.extensions.join(', ')}`,
  )

  outro()
}

/**
 * Both selectors absent means both sections, which is the bash default. Naming
 * both is the same as naming neither rather than an error, since the two flags
 * read as filters and a caller passing both is asking for everything.
 */
function selectedSections(opts: ListOptions): {
  stacks: boolean
  rules: boolean
} {
  const stacks = opts.stacks === true
  const rules = opts.rules === true
  if (stacks === rules) return { stacks: true, rules: true }
  return { stacks, rules }
}

/**
 * `JSON.stringify` replaces a `printf` that interpolated a description into a
 * JSON string literal through a hand-rolled escaper, so a rule carrying a
 * character that escaper missed emitted output a consuming skill could not
 * parse.
 *
 * `unreferenced` rides the same payload rather than taking a flag of its own.
 * The verify stage and a skill asking what a stack leaves out read one call,
 * and the key is additive, so a consumer reading `stacks` or `rules` is
 * untouched by it.
 */
function runList(opts: ListOptions): number {
  const catalog = buildGovCatalog(PROJECT_ROOT)
  const sections = selectedSections(opts)

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify({
        ...(sections.stacks ? { stacks: catalog.stacks } : {}),
        ...(sections.rules ? { rules: catalog.rules } : {}),
        unreferenced: catalog.unreferenced,
      })}\n`,
    )
    return 0
  }

  intro('aitk gov list')

  if (sections.stacks) {
    logStep('Stacks')
    for (const entry of catalog.stacks) logInfo(describeStack(entry))
  }

  if (sections.rules) {
    logStep('Rules')
    for (const entry of catalog.rules) logInfo(describeRule(entry))
  }

  if (catalog.unreferenced.length > 0) {
    logStep('Reached by no stack')
    for (const rule of catalog.unreferenced) logInfo(rule)
  }

  outro()
  return 0
}

/**
 * Silent on success so the consumed-copy stage that calls it stays as quiet as
 * the three `mirror_dir` lines it sits beside. The installed set is readable on
 * disk, so printing it would only add noise to every `bun run check`.
 */
async function runRegen(opts: RegenOptions): Promise<number> {
  const result = await regenConsumedRules(resolve(opts.root ?? PROJECT_ROOT))

  if (!result.ok) {
    process.stderr.write(`Consumed-rules regen failed: ${result.reason}\n`)
    return 1
  }

  return 0
}

/**
 * Renders the target-relative path the prompt quotes, keeping the argument the
 * caller typed rather than the absolute path it resolves to.
 */
function displayPath(target: string, rel: string): string {
  const trimmed = target.replace(/\/$/, '').replace(/^\.\//, '')
  return trimmed === '' || trimmed === '.' ? rel : `${trimmed}/${rel}`
}

/**
 * Refuses rather than picking. `select_option` returned `options[0]` under
 * `AITK_NON_INTERACTIVE=1`, so a headless `aitk gov install` with no stack
 * installed whichever stack sorted first, measured as 26 astro rules into an
 * empty directory. Every documented agent path already passes the argument.
 */
async function chooseStack(root: string): Promise<string | number> {
  const stacks = listGovStacks(root)

  if (stacks.length === 0) {
    logError('No stacks found in governance/stacks/')
    outro()
    return 1
  }

  if (isNonInteractive()) {
    logError(
      `Stack argument is required in non-interactive mode. One of: ${stacks.join(', ')}.`,
    )
    outro()
    return 1
  }

  return select({
    message: 'Select stack to install:',
    options: stacks.map((stack) => ({ value: stack, label: stack })),
  })
}

async function runInstall(
  stack: string | undefined,
  target: string,
  opts: InstallOptions,
): Promise<number> {
  intro('aitk gov install')

  const resolved = resolveTarget(target, PROJECT_ROOT)
  if (typeof resolved === 'number') return resolved

  let selected = stack
  if (selected === undefined) {
    const choice = await chooseStack(PROJECT_ROOT)
    if (typeof choice === 'number') return choice
    selected = choice
  }

  if (!govStackExists(PROJECT_ROOT, selected)) {
    logError(`Stack not found: ${selected}`)
    outro()
    return 1
  }

  const resolution = resolveRules(PROJECT_ROOT, selected)
  if (!resolution.ok) {
    logError(`Stack not found: ${resolution.missingStack}`)
    outro()
    return 1
  }

  const add = opts.add ?? ''
  const rules =
    add === '' ? resolution.rules : mergeExtraRules(resolution.rules, add)

  if (rules.length === 0) {
    logWarn(`No rules defined for stack: ${selected}`)
    outro()
    return 0
  }

  logStep(
    add === ''
      ? `Resolving stack: ${selected}`
      : `Resolving stack: ${selected} + extras`,
  )

  const { found, missing } = lookupRules(PROJECT_ROOT, rules)
  for (const rule of missing) logWarn(`${rule} (source not found, skipping)`)
  for (const source of found) logInfo(source.rule)

  const shouldInstall = await select({
    message: `Install ${found.length} rules to ${displayPath(target, RULES_REL)}?`,
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

  logStep('Installing rules')
  for (const rel of await installRules(found, resolved)) logAdd(rel)
  await recordStamp(createGovAdapter(PROJECT_ROOT), resolved, new Date())

  if (!hasStandards(resolved)) {
    logWarn(
      `Rules reference .claude/standards/. Run 'aitk standards install ${target}' or 'aitk init' so the references resolve.`,
    )
  }

  outro()
  process.stderr.write(`${GREEN}✓ Rules installed${NC}\n`)
  return 0
}

/**
 * Emits the rules payload the `gov-*` skills read. The output lands in the
 * target's scratch directory rather than stdout because the file is the
 * contract, and the skills point at the path.
 */
async function runBuild(target: string): Promise<number> {
  intro('aitk gov build')

  const resolved = resolve(target)
  const rulesDir = join(resolved, RULES_REL)

  if (!existsSync(rulesDir)) {
    logError(`No rules found at ${rulesDir}. Run \`aitk gov install\` first.`)
    outro()
    return 1
  }

  const files = listRuleFiles(rulesDir)
  logStep(`Reading ${RULES_REL} (${files.length} found)`)
  for (const file of files) {
    logInfo(basename(file))
  }

  const shouldBuild = await select({
    message: `Build ${files.length} rules to ${PAYLOAD_REL}?`,
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' },
    ],
    nonInteractiveDefault: true,
  })

  if (!shouldBuild) {
    logWarn('Cancelled')
    outro()
    return 0
  }

  logStep('Building rules payload')
  const output = join(resolved, PAYLOAD_REL)
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, buildRulesPayload(files))
  logAdd(PAYLOAD_REL)

  outro()
  process.stderr.write(
    `${GREEN}✓ Rules built (${files.length} rules → ${PAYLOAD_REL})${NC}\n`,
  )
  return 0
}
