export const SKIPPABLE_DOMAINS = ['wiki', 'standards'] as const

export type SkippableDomain = (typeof SKIPPABLE_DOMAINS)[number]

export interface SkipPlan {
  readonly skipped: ReadonlySet<SkippableDomain>
  /** Values that named nothing skippable. Warned about, never fatal. */
  readonly unknown: readonly string[]
}

export type PreviewLevel = 'info' | 'warn'

export interface PreviewLine {
  readonly level: PreviewLevel
  readonly text: string
}

export interface InitPlan {
  readonly preview: readonly PreviewLine[]
  readonly total: number
}

export interface InitFlags {
  readonly stack?: string
  readonly add?: string
  readonly snippets: string
  readonly skip: SkipPlan
}

/**
 * Reads the `--skip` list. An unrecognized value is reported and dropped rather
 * than aborting, because the flag names optional domains and a typo should not
 * cost the operator the whole init.
 */
export function parseSkip(csv: string | undefined): SkipPlan {
  const skipped = new Set<SkippableDomain>()
  const unknown: string[] = []

  for (const raw of (csv ?? '').split(',')) {
    const item = raw.trim()
    if (item === '') continue

    if (isSkippable(item)) skipped.add(item)
    else unknown.push(item)
  }

  return { skipped, unknown }
}

/**
 * Builds the preview and the count from one pass, so the two cannot disagree.
 * Every `info` line is a domain that will run, which is what makes the count a
 * filter rather than a second tally kept in step by hand. A skipped domain
 * prints nothing at all and governance without a stack prints a warning, so
 * neither reaches the total.
 */
export function planInit(flags: InitFlags): InitPlan {
  const preview: PreviewLine[] = [
    { level: 'info', text: 'base tooling (configs, seeds, deps, scripts)' },
    { level: 'info', text: 'claude (workflow docs, settings)' },
  ]

  if (flags.stack === undefined || flags.stack === '') {
    preview.push({ level: 'warn', text: 'governance (skipped: no --stack)' })
  } else if (flags.add === undefined || flags.add === '') {
    preview.push({ level: 'info', text: `governance (stack: ${flags.stack})` })
  } else {
    preview.push({
      level: 'info',
      text: `governance (stack: ${flags.stack}, extras: ${flags.add})`,
    })
  }

  if (!flags.skip.skipped.has('standards')) {
    preview.push({ level: 'info', text: 'standards (authoring conventions)' })
  }

  preview.push({ level: 'info', text: `snippets (${flags.snippets})` })

  if (!flags.skip.skipped.has('wiki')) {
    preview.push({ level: 'info', text: 'wiki (index and reference pages)' })
  }

  const total = preview.filter((line) => line.level === 'info').length

  return { preview, total }
}

function isSkippable(value: string): value is SkippableDomain {
  return (SKIPPABLE_DOMAINS as readonly string[]).includes(value)
}
