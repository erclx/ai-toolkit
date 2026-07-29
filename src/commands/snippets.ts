import type { Command } from 'commander'
import { registerPassThroughVerbs } from '@/commands/pass-through'
import { PROJECT_ROOT } from '@/exec'
import { createSnippetsAdapter } from '@/snippets/adapter'
import { BASE_CATEGORY, isInternalCategoryName } from '@/snippets/categories'
import {
  ALL_CATEGORY,
  installSnippets,
  installableCategories,
  resolveSnippets,
} from '@/snippets/install'
import { buildSnippetsCatalog } from '@/snippets/list'
import { runDomainSync } from '@/sync/engine'
import { resolveTarget } from '@/target'
import {
  intro,
  isNonInteractive,
  logAdd,
  logError,
  logInfo,
  logStep,
  logWarn,
  outro,
  select,
} from '@/ui'

const GREEN = '\x1b[0;32m'
const NC = '\x1b[0m'

const SNIPPETS_REL = '.claude/snippets'

const PASS_THROUGH_VERBS = ['create'] as const

interface ListOptions {
  readonly categories?: boolean
  readonly entries?: boolean
  readonly json?: boolean
}

export function register(program: Command): void {
  const snippets = program
    .command('snippets')
    .description('Snippets commands (install, sync, create, list)')
    .helpOption('-h, --help', 'Show this help message')

  snippets
    .command('install')
    .description('Install snippets into .claude/snippets/')
    .argument('[category]', "Preset, folder, or 'all'")
    .argument('[target]', 'Target directory', '.')
    .helpOption('-h, --help', 'Show this help message')
    .addHelpText(
      'after',
      [
        '',
        'Examples:',
        '  aitk snippets install essentials',
        '  aitk snippets install all',
        '  aitk snippets install claude ../my-app',
        '',
      ].join('\n'),
    )
    .action(async (category: string | undefined, target: string) => {
      process.exitCode = await runInstall(category, target)
    })

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
 * Refuses rather than picking, the same judgment `aitk gov install` applies to
 * its stack picker. Headless, `select_option` returned the first option, which
 * here was `all`, so an agent omitting the argument installed every category.
 */
async function chooseCategory(root: string): Promise<string | number> {
  const categories = installableCategories(root)

  if (categories.length === 0) {
    logError('No categories found in snippets source.')
    outro()
    return 1
  }

  if (isNonInteractive()) {
    logError(
      `Category argument is required in non-interactive mode. One of: ${[ALL_CATEGORY, ...categories].join(', ')}.`,
    )
    outro()
    return 1
  }

  return select({
    message: 'Select category to install:',
    options: [ALL_CATEGORY, ...categories].map((name) => ({
      value: name,
      label: name,
    })),
  })
}

async function runInstall(
  category: string | undefined,
  target: string,
): Promise<number> {
  intro('aitk snippets install')

  const resolved = resolveTarget(target, PROJECT_ROOT)
  if (typeof resolved === 'number') return resolved

  let selected = category
  if (selected === undefined) {
    const choice = await chooseCategory(PROJECT_ROOT)
    if (typeof choice === 'number') return choice
    selected = choice
  }

  if (isInternalCategoryName(selected)) {
    logError(
      `Category '${selected}' is internal to the toolkit and not installable.`,
    )
    outro()
    return 1
  }

  const resolution = resolveSnippets(PROJECT_ROOT, selected)
  if (!resolution.ok) {
    logError(`Category not found: ${resolution.unknownCategory}`)
    outro()
    return 1
  }

  logStep(resolution.step)
  for (const slug of resolution.missing) {
    logWarn(`${slug} (source not found, skipping)`)
  }

  if (resolution.files.length === 0) {
    logWarn(`No snippets found for category: ${selected}`)
    outro()
    return 0
  }

  for (const file of resolution.files) logInfo(file.relPath)

  const display = target.replace(/\/$/, '')
  const shouldInstall = await select({
    message: `Install ${resolution.files.length} snippets to ${display}/${SNIPPETS_REL}?`,
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' },
    ],
    nonInteractiveDefault: true,
  })

  if (!shouldInstall) {
    logWarn('Cancelled')
    outro()
    return 0
  }

  logStep('Installing snippets')
  for (const rel of await installSnippets(resolution.files, resolved)) {
    logAdd(rel)
  }

  outro()
  process.stderr.write(`${GREEN}✓ Snippets installed${NC}\n`)
  return 0
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
  const catalog = buildSnippetsCatalog(PROJECT_ROOT)

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(catalog)}\n`)
    return 0
  }

  intro('aitk snippets list')

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
