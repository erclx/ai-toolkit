import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import type { Command } from 'commander'
import { execScript, PROJECT_ROOT } from '@/exec'
import { createGovAdapter } from '@/gov/adapter'
import { buildRulesPayload, listRuleFiles } from '@/gov/payload'
import { runDomainSync } from '@/sync/engine'
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
const NC = '\x1b[0m'

const PAYLOAD_REL = join('.claude', '.tmp', 'gov', 'rules.md')
const RULES_REL = join('.claude', 'rules')

const PASS_THROUGH_VERBS = ['install', 'list'] as const

export function register(program: Command): void {
  const gov = program
    .command('gov')
    .description('Governance commands (install, sync, build, list)')
    .helpOption('-h, --help', 'Show this help message')

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

  for (const verb of PASS_THROUGH_VERBS) {
    gov
      .command(verb)
      .description(`Run the gov ${verb} command`)
      .allowUnknownOption()
      .allowExcessArguments(true)
      .passThroughOptions()
      .action(async (_opts: unknown, cmd: Command) => {
        if (!cmd.args.includes('-h') && !cmd.args.includes('--help')) {
          intro('aitk gov')
        }
        await execScript(`gov/${verb}.sh`, cmd.args)
      })
  }
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
