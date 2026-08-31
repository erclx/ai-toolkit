import type { Command } from 'commander'
import { execScript } from '@/exec'
import { intro } from '@/ui'

/**
 * Registers the verbs a domain has not migrated yet, each forwarding to
 * `scripts/<domain>/<verb>.sh`. Naming them instead of catching everything on
 * the parent gives each verb its own `--help` and lets a migrated sibling sit
 * alongside them.
 */
export function registerPassThroughVerbs(
  parent: Command,
  domain: string,
  verbs: readonly string[],
): void {
  for (const verb of verbs) {
    parent
      .command(verb)
      .description(`Run the ${domain} ${verb} command`)
      .allowUnknownOption()
      .allowExcessArguments(true)
      .passThroughOptions()
      .helpOption(false)
      .action(async (_opts: unknown, cmd: Command) => {
        if (!isHelpRequest(cmd.args)) intro(`canon ${domain}`)
        await execScript(`${domain}/${verb}.sh`, cmd.args)
      })
  }
}

/**
 * Commander resolves `--help` before an action runs, so a pass-through verb
 * that keeps the built-in help option prints a one-line stub instead of the
 * script's usage. Disabling it lets the flag reach the script, which owns the
 * real flag surface, and this guard keeps the frame from opening around it.
 */
function isHelpRequest(args: readonly string[]): boolean {
  return args.includes('-h') || args.includes('--help')
}
