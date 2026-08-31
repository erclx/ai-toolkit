import type { Command } from 'commander'
import { registerPassThroughVerbs } from '@/commands/pass-through'
import { listTopics, readTopic, resolveTopic } from '@/docs/read'
import { execScript } from '@/exec'
import { PROJECT_ROOT } from '@/project-root'
import { intro, logError, logInfo, logStep, logWarn, outro } from '@/ui'

export function register(program: Command): void {
  const docs = program
    .command('docs')
    .description('Emit toolkit reference docs (list, <topic>)')
    .argument('[topic]', 'Doc to print, by exact name')
    .helpOption('-h, --help', 'Show this help message')
    .addHelpText(
      'after',
      [
        '',
        'Examples:',
        '  canon docs list',
        '  canon docs list --json',
        '  canon docs agents',
        '',
      ].join('\n'),
    )
    .action(async (topic: string | undefined) => {
      if (topic === undefined) {
        intro('canon docs')
        await execScript('docs/list.sh', [])
        return
      }

      process.exitCode = get(topic)
    })

  registerPassThroughVerbs(docs, 'docs', ['list'])
}

/**
 * Writes the document body to stdout and every frame line to stderr, so a
 * caller capturing the output with `$(...)` receives the document alone.
 */
function get(topic: string): number {
  intro('canon docs')

  const resolved = resolveTopic(PROJECT_ROOT, topic)

  if (!resolved) {
    logWarn(`Unknown topic: ${topic}`)
    logStep('Available topics')
    for (const name of listTopics(PROJECT_ROOT)) logInfo(name)
    logError("Run 'canon docs list' for descriptions.")
    outro()
    return 1
  }

  logStep(resolved.rel)
  process.stdout.write(readTopic(resolved))
  outro()
  return 0
}
