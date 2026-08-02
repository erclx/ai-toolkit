import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const FRONTMATTER = /^---\n([\s\S]*?)\n---/

export interface SkillListing {
  readonly name: string
  readonly description: string
}

/**
 * Enumerates the plugin skill catalog, which is the corpus under `claude/`
 * rather than the internal skills under `.claude/`. Only the former installs
 * into a target, so a count taken across both overstates what ships.
 *
 * The folder name wins over the frontmatter `name` when they disagree, because
 * Claude Code invokes a skill by its directory.
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
