import type { Command } from 'commander'
import { registerPassThroughVerbs } from '@/commands/pass-through'
import { PROJECT_ROOT } from '@/exec'
import { createSnippetsAdapter } from '@/snippets/adapter'
import { runDomainSync } from '@/sync/engine'

const PASS_THROUGH_VERBS = ['install', 'list', 'create'] as const

export function register(program: Command): void {
  const snippets = program
    .command('snippets')
    .description('Snippets commands (install, sync, create, list)')
    .helpOption('-h, --help', 'Show this help message')

  snippets
    .command('sync')
    .description('Update snippets already installed under .claude/snippets/')
    .argument('[target]', 'Target directory', '.')
    .helpOption('-h, --help', 'Show this help message')
    .action(async (target: string) => {
      process.exitCode = await runDomainSync(
        createSnippetsAdapter(PROJECT_ROOT),
        target,
        { protectedRoot: PROJECT_ROOT },
      )
    })

  registerPassThroughVerbs(snippets, 'snippets', PASS_THROUGH_VERBS)
}
