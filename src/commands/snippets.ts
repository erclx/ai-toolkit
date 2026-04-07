import type { Command } from 'commander'
import { execScript } from '@/exec'

export function register(program: Command): void {
  program
    .command('snippets')
    .description('Snippets commands (install, sync)')
    .allowUnknownOption()
    .allowExcessArguments(true)
    .passThroughOptions()
    .action(async (_opts: unknown, cmd: Command) => {
      await execScript('manage-snippets.sh', cmd.args)
    })
}
