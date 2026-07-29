import { existsSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { stripFrontmatter } from '@/frontmatter'

const INDEX_TOPIC = 'index'

/**
 * The two roots a topic resolves against, in precedence order. `docs/` holds
 * consumer-facing reference and `.claude/context/` holds per-domain internal
 * narrative, so a name present in both resolves to the consumer-facing copy.
 */
const ROOTS: readonly string[] = ['docs', join('.claude', 'context')]

export interface ResolvedTopic {
  readonly path: string
  readonly rel: string
}

export function resolveTopic(
  root: string,
  topic: string,
): ResolvedTopic | undefined {
  for (const dir of ROOTS) {
    const rel = join(dir, `${topic}.md`)
    const path = join(root, rel)
    if (existsSync(path)) return { path, rel }
  }

  return undefined
}

/**
 * Names every topic a `get` could resolve, listed per root in the order the
 * roots are searched. Shown when a topic misses, so it doubles as the answer to
 * what the caller should have typed.
 */
export function listTopics(root: string): string[] {
  const topics: string[] = []

  for (const dir of ROOTS) {
    const cwd = join(root, dir)
    if (!existsSync(cwd)) continue

    const names = [
      ...new Bun.Glob('*.md').scanSync({ cwd, onlyFiles: true, dot: true }),
    ]
      .map((name) => basename(name, '.md'))
      .filter((name) => name !== INDEX_TOPIC)
      .sort()

    topics.push(...names)
  }

  return topics
}

export function readTopic(topic: ResolvedTopic): string {
  return stripFrontmatter(readFileSync(topic.path, 'utf8'))
}
