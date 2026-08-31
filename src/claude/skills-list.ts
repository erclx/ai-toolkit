import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { CORPORA } from '@/claude/skills-audit'

const FRONTMATTER = /^---\n([\s\S]*?)\n---/

export interface SkillListing {
  readonly name: string
  readonly description: string
  readonly requirement: boolean
}

export interface SkillsCorpus {
  /**
   * The corpus spelling in POSIX form, so a report reads the same on Windows.
   * `CorpusReport.rel` in `skills-audit.ts` is the same spelling left as `join`
   * produced it, so the two verbs disagree there. Normalizing it is a contract
   * change on an existing JSON field and belongs to a branch reading the audit.
   */
  readonly rel: string
  /** The folder a listing reads, absolute against the root it was resolved at. */
  readonly dir: string
}

/**
 * The skill corpus a measure reads at a given root: the shipped tree in this
 * repository and a target's own `.claude/skills/` in a project that consumes
 * it. `CORPORA` order settles a tree carrying both, so every reading taken
 * here still comes from `claude/skills/`.
 *
 * Kept apart from `listSkills` deliberately. `src/counts/catalogs.ts` counts
 * the shipped catalog through that function, so teaching it to read both
 * corpora would move the reported total off the tree that installs and
 * falsify every sentence in the corpus stating it.
 */
export function resolveSkillsCorpus(root: string): SkillsCorpus | undefined {
  for (const rel of CORPORA) {
    const dir = join(root, rel)
    if (existsSync(dir)) return { rel: rel.replaceAll('\\', '/'), dir }
  }

  return undefined
}

/**
 * Enumerates the plugin skill catalog, which is the corpus under `claude/`
 * rather than the internal skills under `.claude/`. Only the former installs
 * into a target, so a count taken across both overstates what ships.
 *
 * The folder name wins over the frontmatter `name` when they disagree, because
 * Claude Code invokes a skill by its directory.
 *
 * `requirement` reports whether the folder carries `REQUIREMENT.md`. Every skill
 * is meant to carry one, so a false is a gap rather than a recorded exemption.
 * `canon claude skills audit` is what fails on it, across both corpora.
 */
export function listSkills(root: string): SkillListing[] {
  return listSkillsAt(join(root, 'claude', 'skills'))
}

/**
 * The same enumeration against a corpus folder the caller already resolved,
 * which is what `resolveSkillsCorpus` hands a measure that reaches a target.
 */
export function listSkillsAt(skillsRoot: string): SkillListing[] {
  if (!existsSync(skillsRoot)) return []

  const paths = [
    ...new Bun.Glob('*/SKILL.md').scanSync({
      cwd: skillsRoot,
      onlyFiles: true,
    }),
  ].sort()

  return paths.map((path) => ({
    name: dirname(path),
    description: readDescription(join(skillsRoot, path)),
    requirement: existsSync(join(skillsRoot, dirname(path), 'REQUIREMENT.md')),
  }))
}

/**
 * Returns an empty description rather than throwing on a skill whose
 * frontmatter is missing or unparseable, so one malformed file does not hide
 * the rest of the catalog from a caller counting it.
 */
function readDescription(path: string): string {
  const match = FRONTMATTER.exec(readFileSync(path, 'utf8'))
  if (!match) return ''

  try {
    const parsed = Bun.YAML.parse(match[1])
    if (typeof parsed !== 'object' || parsed === null) return ''
    const { description } = parsed as Record<string, unknown>
    return typeof description === 'string' ? description : ''
  } catch {
    return ''
  }
}
