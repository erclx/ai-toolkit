import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import type { Command } from 'commander'
import { registerPassThroughVerbs } from '@/commands/pass-through'
import { PROJECT_ROOT } from '@/exec'
import { createGovAdapter } from '@/gov/adapter'
import { hasStandards, installRules, lookupRules } from '@/gov/install'
import { buildRulesPayload, listRuleFiles } from '@/gov/payload'
import {
  govStackExists,
  listGovStacks,
  mergeExtraRules,
  resolveRules,
} from '@/gov/stacks'
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

const PASS_THROUGH_VERBS = ['list'] as const

interface InstallOptions {
  readonly add?: string
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

  registerPassThroughVerbs(gov, 'gov', PASS_THROUGH_VERBS)
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
