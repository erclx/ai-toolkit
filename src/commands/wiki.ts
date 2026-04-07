import type { Command } from 'commander'
import { execScript } from '@/exec'

export function register(program: Command): void {
  program
    .command('wiki')
    .description('Wiki commands (init)')
    .allowUnknownOption()
    .allowExcessArguments(true)
    .passThroughOptions()
    .action(async (_opts: unknown, cmd: Command) => {
      await execScript('manage-wiki.sh', cmd.args)
    })
}
