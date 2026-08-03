import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const FRONTMATTER = /^---\n([\s\S]*?)\n---/

export interface SkillListing {
  readonly name: string
  readonly description: string
  readonly requirement: boolean
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
 * `aitk claude skills audit` is what fails on it, across both corpora.
 */
export function listSkills(root: string): SkillListing[] {
  const skillsRoot = join(root, 'claude', 'skills')
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
