import type { Command } from 'commander'
import { execScript } from '@/exec'

export function register(program: Command): void {
  program
    .command('claude')
    .description('Claude workflow (init, sync, prompt)')
    .allowUnknownOption()
    .allowExcessArguments(true)
    .passThroughOptions()
    .action(async (_opts: unknown, cmd: Command) => {
      await execScript('manage-claude.sh', cmd.args)
    })
}
