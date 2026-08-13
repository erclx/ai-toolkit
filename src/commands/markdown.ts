import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Command } from 'commander'
import { type BanReport, banReport, loadStandards } from '@/markdown/bans'
import { resolveMarkdown } from '@/markdown/files'
import { isGating } from '@/markdown/gate'
import { type BanFinding, bodyLines, scanBans } from '@/markdown/scan'
import {
  type Checkpoints,
  measureStructure,
  parseCheckpoints,
  type StructureReport,
} from '@/markdown/structure'
import {
  intro,
  logInfo,
  logStep,
  logWarn,
  outro,
  pipeOutput,
  plural,
} from '@/ui'

const EXIT_GATE = 2

interface AuditCommandOptions {
  readonly json?: boolean
}

interface FileReport {
  readonly rel: string
  readonly bans: readonly BanFinding[]
  readonly structure: StructureReport
}

export function register(program: Command): void {
  const markdown = program
    .command('markdown')
    .description('Report markdown files against the attribute standards')
    .helpOption('-h, --help', 'Show this help message')

  markdown
    .command('audit')
    .description(
      'Fail on a banned character, word, or spelling, and report bullet, paragraph, and depth weight',
    )
    .argument(
      '[path...]',
      'Markdown files, directories, or globs, defaulting to every markdown file git lists',
    )
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  the audit completed with no gating finding',
        '  1  refused, with the reason on stderr',
        '  2  a banned character, word, or spelling is present',
        '',
        'A ban hit is a fact and gates unconditionally. Bullet, paragraph, and',
        'depth weight are judgments a reader settles, so all three report and',
        'none of them fails a run.',
        '',
        'Rewrite the sentence carrying a hit rather than swapping the token for',
        'a near-synonym. A code span clears the report and is the answer only',
        'where the token is genuinely an identifier under discussion, which is',
        'what markdown.md reserves the span for.',
        '',
        'Bans and checkpoints are read from markdown.md and prose.md, resolved',
        'under .claude/standards/, then standards/, then the corpus inside the',
        'aitk package, so a project that installed neither is still measured.',
        'The report names the copy it read. No folder has to resolve and no',
        'index.md has to exist, so .claude/rules/, governance/, and snippets/',
        'are in reach.',
        '',
        'Examples:',
        '  aitk markdown audit',
        '  aitk markdown audit --json',
        '  aitk markdown audit .claude/rules governance',
        '  aitk markdown audit docs/agents/commands.md',
        "  aitk markdown audit 'snippets/**/*.md'",
        '',
      ].join('\n'),
    )
    .action(async (paths: string[], opts: AuditCommandOptions) => {
      process.exitCode = await runAudit(paths, opts)
    })
}

async function runAudit(
  paths: string[],
  opts: AuditCommandOptions,
): Promise<number> {
  const root = process.cwd()
  const scope = await resolveMarkdown(root, paths)

  if (scope.kind === 'unavailable') {
    return refuse(
      'git could not list the tree, so no corpus was built. Run inside a git repository.',
    )
  }

  if (scope.files.length === 0) {
    return refuse(
      paths.length === 0
        ? 'No markdown file in the tree.'
        : `No markdown file matched: ${scope.unmatched.join(', ')}`,
    )
  }

  const standards = await loadStandards(root)
  const bans = banReport(standards)
  const checkpoints = parseCheckpoints(standards.markdown?.text ?? '')

  const reports: FileReport[] = await Promise.all(
    scope.files.map(async (rel) => {
      const lines = bodyLines(await readFile(resolve(root, rel), 'utf8'))
      return {
        rel,
        bans: scanBans(lines, bans),
        structure: measureStructure(rel, lines, checkpoints),
      }
    }),
  )

  intro('aitk markdown audit')
  reportScope(scope.files, scope.unmatched)
  reportBans(reports, bans)
  reportBullets(reports, checkpoints)
  reportParagraphs(reports, checkpoints)
  reportDepth(reports, checkpoints)
  outro()

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify({
        root,
        files: scope.files,
        unmatchedPaths: scope.unmatched,
        bans: {
          characters: bans.characters,
          words: bans.words,
          spellings: bans.spellings,
          sources: bans.sources,
          missingStandards: bans.missing,
        },
        checkpoints: {
          run: checkpoints.run,
          peerBullet: checkpoints.peerBullet,
          bullet: checkpoints.bullet,
          paragraph: checkpoints.paragraph,
          sentences: checkpoints.sentences,
          renderWidth: checkpoints.renderWidth,
          fellBack: checkpoints.fellBack,
        },
        entries: reports.map((report) => ({
          path: report.rel,
          bans: report.bans,
          longestRun: report.structure.longestRun,
          longestRunLine: report.structure.longestRunLine,
          heavyBullets: report.structure.heavyBullets,
          heavyParagraphs: report.structure.heavyParagraphs,
        })),
      })}\n`,
    )
  }

  const gating = isGating({
    bans: reports.flatMap((report) => report.bans),
    structure: reports.map((report) => report.structure),
  })

  return gating ? EXIT_GATE : 0
}

function refuse(message: string): number {
  intro('aitk markdown audit')
  logStep('Refused')
  logWarn(message)
  outro()
  return 1
}

function reportScope(
  files: readonly string[],
  unmatched: readonly string[],
): void {
  logStep('Scope')
  logInfo(`${plural(files.length, 'markdown file')}`)

  if (unmatched.length === 0) return

  logWarn(`Matched no markdown file: ${unmatched.join(', ')}`)
}

/**
 * Names what the closed sets reach and what they leave to a reader.
 *
 * The two standards state bans in three shapes and only two of them are a
 * closed set. A phrase ban carries a placeholder standing in for the rest of
 * the sentence and every voice rule is a judgment, so a report listing hits
 * without naming those would read as a verdict on the whole standard.
 */
function reportBans(reports: readonly FileReport[], bans: BanReport): void {
  logStep('Bans')

  if (bans.missing.length > 0) {
    logWarn(
      `Not measured. Found no copy of: ${bans.missing.join(', ')}. Looked under .claude/standards/, then standards/, then the aitk package.`,
    )
    if (bans.sources.length === 0) return
  }

  logInfo(
    `${plural(bans.characters.length, 'character')}, ${plural(bans.words.length, 'word')}, and ${plural(bans.spellings.length, 'spelling')} read from ${bans.sources.join(' and ')}`,
  )
  logInfo(
    'Frontmatter, fenced blocks, code spans, and link destinations are excluded.',
  )
  logInfo(
    'Phrase bans and every voice rule are patterns rather than closed sets, and stay a judgment for the reader.',
  )

  const carrying = reports
    .filter((report) => report.bans.length > 0)
    .sort((a, b) => b.bans.length - a.bans.length)

  if (carrying.length === 0) {
    logInfo('No banned character, word, or spelling.')
    return
  }

  const total = carrying.reduce((sum, report) => sum + report.bans.length, 0)
  logWarn(`${plural(total, 'hit')} across ${plural(carrying.length, 'file')}`)
  logWarn('This fails the run. Every other check below reports.')
  logInfo(
    'Rewrite the sentence rather than swapping the token for a near-synonym.',
  )
  logInfo(
    'A code span clears the report and is the answer only where the token is genuinely an identifier under discussion, which is what markdown.md reserves the span for.',
  )
  pipeOutput(
    carrying
      .map(
        (report) =>
          `${report.rel}  ${plural(report.bans.length, 'hit')}\n${report.bans
            .map(
              (found) =>
                `  :${found.line}:${found.column + 1}  ${found.kind}  ${found.term}`,
            )
            .join('\n')}`,
      )
      .join('\n'),
  )
}

function reportBullets(
  reports: readonly FileReport[],
  checkpoints: Checkpoints,
): void {
  logStep('Bullets')
  logInfo(
    'Top-level bullets measure characters, folding in continuation lines.',
  )
  logInfo(
    'Nested items and fenced blocks are excluded. Weight is a judgment, never a defect.',
  )

  const carrying = reports
    .filter((report) => report.structure.heavyBullets.length > 0)
    .sort(
      (a, b) =>
        b.structure.heavyBullets.length - a.structure.heavyBullets.length,
    )

  if (carrying.length === 0) {
    logInfo(`No bullet past the ${checkpoints.bullet}-character checkpoint.`)
    return
  }

  const total = carrying.reduce(
    (sum, report) => sum + report.structure.heavyBullets.length,
    0,
  )
  logWarn(
    `${plural(total, 'bullet')} past the ${checkpoints.bullet}-character checkpoint across ${plural(carrying.length, 'file')}`,
  )
  pipeOutput(
    carrying
      .map(
        (report) =>
          `${report.rel}  ${plural(report.structure.heavyBullets.length, 'bullet')}\n${report.structure.heavyBullets
            .map((found) => `  :${found.line}  ${found.characters} characters`)
            .join('\n')}`,
      )
      .join('\n'),
  )
}

/**
 * States both halves of the checkpoint on every run.
 *
 * The standard states a sentence cap and a weight, and a report naming only the
 * first would leave a reader unable to tell why a two-sentence paragraph is
 * listed.
 */
function reportParagraphs(
  reports: readonly FileReport[],
  checkpoints: Checkpoints,
): void {
  logStep('Paragraphs')
  logInfo(
    `Prose paragraphs report past ${checkpoints.sentences} sentences or past ${checkpoints.paragraph} characters.`,
  )
  logInfo(
    'The standard states both, and weight moves independently of the bullet checkpoint.',
  )
  logInfo(
    'Bullets, headings, tables, quotes, and fenced blocks each end a paragraph, so a bullet is measured once.',
  )

  const carrying = reports
    .filter((report) => report.structure.heavyParagraphs.length > 0)
    .sort(
      (a, b) =>
        b.structure.heavyParagraphs.length - a.structure.heavyParagraphs.length,
    )

  if (carrying.length === 0) {
    logInfo('No paragraph past either checkpoint.')
    return
  }

  const total = carrying.reduce(
    (sum, report) => sum + report.structure.heavyParagraphs.length,
    0,
  )
  logWarn(
    `${plural(total, 'paragraph')} past a checkpoint across ${plural(carrying.length, 'file')}`,
  )
  pipeOutput(
    carrying
      .map(
        (report) =>
          `${report.rel}  ${plural(report.structure.heavyParagraphs.length, 'paragraph')}\n${report.structure.heavyParagraphs
            .map(
              (found) =>
                `  :${found.line}  ${found.sentences} sentences, ${found.characters} characters`,
            )
            .join('\n')}`,
      )
      .join('\n'),
  )
}

/**
 * Names the render width and the blank-line convention on every run.
 *
 * The standard settles heading level and fenced blocks and stops there, so a
 * hand reader who drops blank lines lands a line or two below this number.
 * Stating both keeps the two measurements reconcilable, and the width matters
 * more, since a number counted in rendered lines cannot be reproduced without
 * it.
 */
function reportDepth(
  reports: readonly FileReport[],
  checkpoints: Checkpoints,
): void {
  logStep('Depth')
  logInfo(
    `Runs measure rendered lines at ${checkpoints.renderWidth} columns and count blank lines.`,
  )
  logInfo(
    `Fenced blocks are excluded, and so are peer lists averaging under ${checkpoints.peerBullet} characters a bullet.`,
  )
  logInfo(
    'A run that is entirely table rows is excluded too, since a heading inside a table splits the table rather than the run.',
  )

  if (checkpoints.fellBack.length > 0) {
    logWarn(
      `Read no number from the standard for: ${checkpoints.fellBack.join(', ')}. Measured against the shipped default instead.`,
    )
  }

  const over = reports
    .filter((report) => report.structure.longestRun > checkpoints.run)
    .sort((a, b) => b.structure.longestRun - a.structure.longestRun)

  if (over.length === 0) {
    logInfo(`No run past the ${checkpoints.run}-line checkpoint.`)
    return
  }

  logWarn(`${over.length} past the ${checkpoints.run}-line checkpoint`)
  pipeOutput(
    over
      .map(
        (report) =>
          `${report.structure.rel}:${report.structure.longestRunLine}  ${report.structure.longestRun} rendered lines unbroken`,
      )
      .join('\n'),
  )
}
