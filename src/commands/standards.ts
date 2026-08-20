import type { Command } from 'commander'
import { registerPassThroughVerbs } from '@/commands/pass-through'
import { listStandards, readStandard, resolveStandard } from '@/standards/read'
import { intro, logError, logInfo, logStep, logWarn, outro } from '@/ui'

export function register(program: Command): void {
  const standards = program
    .command('standards')
    .description('Standards commands (list, <name>)')
    .argument('[name]', 'Standard to print, by name with or without .md')
    .helpOption('-h, --help', 'Show this help message')
    .addHelpText(
      'after',
      [
        '',
        'A name resolves under standards/ at the working root, then the corpus',
        'inside the aitk package. No standard installs into a project, so the',
        'package corpus is what answers there. The frame names the copy it read.',
        '',
        'Examples:',
        '  aitk standards markdown',
        '  aitk standards markdown.md',
        '',
      ].join('\n'),
    )
    .action((name: string | undefined, _options: unknown, cmd: Command) => {
      if (name === undefined) {
        // Registering an action replaces commander's own no-action fallback,
        // which writes this help to stderr. Help is UI rather than data, and
        // the default here is stdout.
        cmd.outputHelp({ error: true })
        process.exitCode = 1
        return
      }

      process.exitCode = print(name)
    })

  registerPassThroughVerbs(standards, 'standards', ['list'])
}

/**
 * Writes the standard to stdout and every frame line to stderr, so a caller
 * capturing the output with `$(...)` receives the document alone.
 *
 * The root is the caller's directory rather than the toolkit's, since a
 * repository that authors standards governs its own copy and the package copy
 * answers everywhere else.
 */
function print(name: string): number {
  intro('aitk standards')

  const root = process.cwd()
  const resolved = resolveStandard(root, name)

  if (!resolved) {
    logWarn(`Unknown standard: ${name}`)
    logStep('Available standards')
    for (const each of listStandards(root)) logInfo(each)
    logError("Run 'aitk standards list' for descriptions.")
    outro()
    return 1
  }

  logStep(resolved.source)
  process.stdout.write(readStandard(resolved))
  outro()
  return 0
}
