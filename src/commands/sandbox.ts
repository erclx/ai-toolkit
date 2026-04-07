import type { Command } from 'commander'
import { execScript } from '@/exec'

export function register(program: Command): void {
  program
    .command('sandbox')
    .description('Provision and run sandbox scenarios')
    .allowUnknownOption()
    .allowExcessArguments(true)
    .passThroughOptions()
    .action(async (_opts: unknown, cmd: Command) => {
      await execScript('manage-sandbox.sh', cmd.args)
    })
}
