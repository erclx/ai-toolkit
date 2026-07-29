import { existsSync, statSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const WIKI_DIR = 'wiki'
const INDEX_FILE = 'index.md'

export const WIKI_DIR_REL = `${WIKI_DIR}/`
export const WIKI_INDEX_REL = join(WIKI_DIR, INDEX_FILE)

const INDEX_SEED = `---
title: Wiki
subtitle: Reference pages for tools, workflows, and concepts
---

# Wiki

Reference pages for tools, workflows, and concepts.
`

export type WikiChange = 'dir' | 'index'

export interface WikiPlan {
  readonly changes: readonly WikiChange[]
  readonly hasIndex: boolean
}

export function wikiDir(target: string): string {
  return join(target, WIKI_DIR)
}

/**
 * Stands in for the `cd "$target"` in the bash `guard_root`, which validated
 * the target existed as a side effect. Without it a typo'd path scaffolds a
 * whole new tree, since the apply step creates parents.
 */
export function isWikiTarget(target: string): boolean {
  try {
    return statSync(target).isDirectory()
  } catch {
    return false
  }
}

/**
 * Reports what a scaffold would create without writing. The directory and the
 * index are tracked separately because a target can carry one without the
 * other, and only the index has content worth preserving.
 */
export function planWikiInit(target: string): WikiPlan {
  const dir = wikiDir(target)
  const index = join(dir, INDEX_FILE)
  const changes: WikiChange[] = []

  if (!existsSync(dir)) changes.push('dir')

  const hasIndex = existsSync(index)
  if (!hasIndex) changes.push('index')

  return { changes, hasIndex }
}

export async function applyWikiInit(
  target: string,
  plan: WikiPlan,
): Promise<void> {
  const dir = wikiDir(target)
  await mkdir(dir, { recursive: true })

  if (plan.changes.includes('index')) {
    await writeFile(join(dir, INDEX_FILE), INDEX_SEED)
  }
}
