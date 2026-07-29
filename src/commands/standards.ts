import type { Command } from 'commander'
import { registerPassThroughVerbs } from '@/commands/pass-through'
import { execScript, PROJECT_ROOT } from '@/exec'
import { createStandardsAdapter } from '@/standards/adapter'
import { runDomainSync } from '@/sync/engine'

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
    .description('Run the standards install command')
    .allowUnknownOption()
    .allowExcessArguments(true)
    .passThroughOptions()
    .helpOption(false)
    .action(async (_opts: unknown, cmd: Command) => {
      await execScript('manage-standards.sh', installArgs(cmd.args))
    })

  registerPassThroughVerbs(standards, 'standards', ['list'])
}

/**
 * `install` still lives inside the dispatcher rather than in a verb script, and
 * the dispatcher only answers `--help` as its first argument. Forwarding the
 * flag alone reaches the usage that documents install, which beats letting it
 * arrive as a target path and fail as a missing directory.
 */
function installArgs(args: readonly string[]): string[] {
  if (args.includes('-h') || args.includes('--help')) return ['--help']
  return ['install', ...args]
}
