import type { Command } from 'commander'
import { registerPassThroughVerbs } from '@/commands/pass-through'
import { checkoutMismatchWarning, PROJECT_ROOT } from '@/project-root'
import { BASE_CATEGORY } from '@/snippets/categories'
import { buildSnippetsCatalog } from '@/snippets/list'
import { intro, logInfo, logStep, logWarn, outro } from '@/ui'

const PASS_THROUGH_VERBS = ['create'] as const

interface ListOptions {
  readonly categories?: boolean
  readonly entries?: boolean
  readonly json?: boolean
}

export function register(program: Command): void {
  const snippets = program
    .command('snippets')
    .description('Snippets commands (create, list)')
    .helpOption('-h, --help', 'Show this help message')

  snippets
    .command('list')
    .description('List snippet presets, categories, and entries')
    .helpOption('-h, --help', 'Show this help message')
    .option('--categories', 'Only list presets and category names')
    .option('--entries', 'Only list entry slugs grouped by category')
    .option('--json', 'Emit machine-readable JSON')
    .action((opts: ListOptions) => {
      process.exitCode = runList(opts)
    })

  registerPassThroughVerbs(snippets, 'snippets', PASS_THROUGH_VERBS)
}

/**
 * `JSON.stringify` replaces a `printf` template that interpolated names into a
 * JSON string literal unescaped, so a slug or category carrying a quote emitted
 * output no consuming skill could parse.
 *
 * The frame opens after the `--json` return, since the bash verb only ever
 * emitted section headers and the pass-through above it owned the `┌`.
 */
function runList(opts: ListOptions): number {
  const mismatch = checkoutMismatchWarning(process.cwd())
  if (mismatch !== undefined) logWarn(mismatch)

  const catalog = buildSnippetsCatalog(PROJECT_ROOT)

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(catalog)}\n`)
    return 0
  }

  intro('canon snippets list')

  const showCategories = opts.entries !== true
  const showEntries = opts.categories !== true

  if (showCategories) {
    if (catalog.presets.length > 0) {
      logStep('Presets')
      for (const preset of catalog.presets) {
        logInfo(`${preset.name} (${preset.slugs.length} entries)`)
      }
    }

    logStep('Categories')
    for (const category of catalog.categories) {
      logInfo(`${category.name} (${category.entries.length} entries)`)
    }
  }

  if (showEntries) {
    logStep('Entries')
    for (const category of catalog.categories) {
      for (const entry of category.entries) {
        logInfo(
          category.name === BASE_CATEGORY ? entry : `${category.name}/${entry}`,
        )
      }
    }
  }

  outro()
  return 0
}
