import { parseFrontmatter, readField } from '@/indexes/frontmatter'
import {
  CATEGORY_BY_TYPE,
  type FindingRemedy,
  MEMORY_NAME,
  memoryType,
} from '@/records/validate'

export const MIGRATE_REFUSALS = ['field-unrecoverable'] as const

export type MigrateRefusal = (typeof MIGRATE_REFUSALS)[number]

export interface MigrateRepair {
  readonly ok: true
  readonly text: string
}

export interface MigrateRefused {
  readonly ok: false
  readonly reason: MigrateRefusal
  readonly message: string
}

export type MigrateOutcome = MigrateRepair | MigrateRefused

function refuse(message: string): MigrateRefused {
  return { ok: false, reason: 'field-unrecoverable', message }
}

/**
 * Repairs the one recoverable shape of `frontmatter-incomplete`: a memory
 * record missing `category` alone. The value sits in the filename's type
 * prefix already, which is the same fact `checkMemory` derives it from, so a
 * repair here writes back what the record already states rather than a value
 * a transform invented. It re-reads the file rather than trusting a value
 * carried on the `Finding`, so a transform and the check it repairs cannot
 * drift apart.
 */
function categoryFromName(name: string, text: string): MigrateOutcome {
  const frontmatter = parseFrontmatter(text)
  if (!frontmatter) {
    return refuse(`${name} carries no frontmatter block to add category to.`)
  }

  if (readField(frontmatter, 'category')) {
    return refuse(`${name} already carries a category.`)
  }

  const match = MEMORY_NAME.exec(name)
  const type = match ? memoryType(match[1]) : undefined
  if (!type) {
    return refuse(
      `${name} is not named <type>-<slug>.md, so category has no type to derive from.`,
    )
  }

  const rewritten = frontmatter.raw.replace(
    /\n---$/,
    `\ncategory: ${CATEGORY_BY_TYPE[type]}\n---`,
  )

  return { ok: true, text: rewritten + text.slice(frontmatter.raw.length) }
}

const TRANSFORMS: Readonly<
  Record<FindingRemedy, (name: string, text: string) => MigrateOutcome>
> = {
  'category-from-name': categoryFromName,
}

/** Applies the transform a finding's `remedy` names against its own text. */
export function migrateRecord(
  remedy: FindingRemedy,
  name: string,
  text: string,
): MigrateOutcome {
  return TRANSFORMS[remedy](name, text)
}
