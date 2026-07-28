import { stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { $ } from 'bun'
import type { Command } from 'commander'
import { exitCodeFor, type RegenResult, regenOne } from '@/indexes/regen'
import { findIndexedAncestor, listIndexes } from '@/indexes/walk'
import { intro, logAdd, logInfo, logStep, logWarn, outro } from '@/ui'

interface RegenCommandOptions {
  readonly dryRun?: boolean
  readonly json?: boolean
  readonly root?: string
  readonly stage?: boolean
}

export function register(program: Command): void {
  // The root program sets helpOption(false) for its own hand-rolled help, and
  // subcommands inherit that. Re-enable it here so each level documents itself.
  const indexes = program
    .command('indexes')
    .description('Regenerate index.md files from sibling frontmatter')
    .helpOption('-h, --help', 'Show this help message')

  indexes
    .command('regen')
    .description('Regenerate index.md files from sibling frontmatter')
    .argument(
      '[paths...]',
      'Paths to resolve up to their nearest indexed folder',
    )
    .helpOption('-h, --help', 'Show this help message')
    .option('--dry-run', 'Report changes without writing')
    .option('--json', 'Emit a machine-readable record per index on stdout')
    .option('--root <path>', 'Walk-up boundary for positional paths')
    .option('--no-stage', 'Skip the auto git add on modified indexes')
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  no drift, nothing to do',
        '  1  frontmatter error or missing index.md',
        '  2  --dry-run found folders that would change',
        '',
        'Examples:',
        '  aitk indexes regen',
        '  aitk indexes regen --dry-run',
        '  aitk indexes regen --json docs/',
        '',
      ].join('\n'),
    )
    .action(async (paths: string[], opts: RegenCommandOptions) => {
      process.exit(await runRegen(paths, opts))
    })
}

async function runRegen(
  paths: string[],
  opts: RegenCommandOptions,
): Promise<number> {
  const root = resolve(opts.root ?? process.cwd())
  const dryRun = opts.dryRun ?? false
  const emitJson = opts.json ?? false

  if (!(await isDirectory(root))) {
    if (emitJson) {
      process.stdout.write(
        `${JSON.stringify({ error: `root not a directory: ${root}` })}\n`,
      )
      return 1
    }
    process.stderr.write(`Root is not a directory: ${root}\n`)
    return 1
  }

  const dirs =
    paths.length > 0
      ? collectFromPaths(paths, root)
      : (await listIndexes(root)).map(dirname)

  // Whole-repo walks never auto-stage. Only an explicit path list does, so a
  // hook regenerating one folder gets its index into the same commit.
  const shouldStage =
    paths.length > 0 && opts.stage !== false && !dryRun && !emitJson

  const results: RegenResult[] = []

  if (!emitJson) {
    intro('aitk indexes')
    logStep(dryRun ? 'Indexes (dry-run)' : 'Indexes')
  }

  for (const dir of dirs) {
    const result = await regenOne(dir, { dryRun })
    results.push(result)
    if (!emitJson) await reportResult(result, root, shouldStage)
  }

  if (emitJson) {
    process.stdout.write(
      `${JSON.stringify({
        root,
        dryRun,
        results: results.map(({ path, action, reason }) =>
          reason ? { path, action, reason } : { path, action },
        ),
      })}\n`,
    )
  } else {
    outro()
  }

  return exitCodeFor(results, { dryRun })
}

function collectFromPaths(paths: string[], root: string): string[] {
  const dirs: string[] = []

  for (const path of paths) {
    const dir = findIndexedAncestor(resolve(root, path), root)
    if (!dir) {
      process.stderr.write(
        `WARN: ${path} has no index.md ancestor under ${root}\n`,
      )
      continue
    }
    if (!dirs.includes(dir)) dirs.push(dir)
  }

  return dirs
}

async function reportResult(
  result: RegenResult,
  root: string,
  shouldStage: boolean,
): Promise<void> {
  const rel = result.path.startsWith(`${root}/`)
    ? result.path.slice(root.length + 1)
    : result.path

  switch (result.action) {
    case 'written':
      logAdd(rel)
      if (shouldStage) await stage(result.path, rel, root)
      break
    case 'would-write':
      logWarn(`${rel} would change`)
      break
    case 'unchanged':
      logInfo(`${rel} unchanged`)
      break
    case 'skipped':
      logInfo(`${rel} skipped (auto:false)`)
      break
    case 'error':
      for (const message of result.errors ?? []) {
        process.stderr.write(`ERROR: ${message}\n`)
      }
      logWarn(`${rel} error`)
      break
  }
}

async function stage(path: string, rel: string, root: string): Promise<void> {
  const staged = await $`git -C ${root} add -- ${path}`
    .quiet()
    .nothrow()
    .then((result) => result.exitCode === 0)

  if (staged) {
    logInfo(`staged ${rel}`)
  } else {
    logWarn(`failed to stage ${rel}`)
  }
}

async function isDirectory(path: string): Promise<boolean> {
  return stat(path)
    .then((info) => info.isDirectory())
    .catch(() => false)
}
