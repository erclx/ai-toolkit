import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * What this run can compute from the tree alone. A field stays absent rather
 * than empty when nothing local resolves it, so a caller never reads
 * "nothing to propose" as "propose removing what is already there."
 */
export interface MetadataProposal {
  readonly description?: string
  readonly homepage?: string
  readonly topics?: readonly string[]
}

/** What the remote already carries, read by the caller rather than here. */
export interface CurrentMetadata {
  readonly description: string
  readonly homepage: string
  readonly topics: readonly string[]
}

export interface MetadataDiff {
  readonly description?: { readonly current: string; readonly proposed: string }
  readonly homepage?: { readonly current: string; readonly proposed: string }
  readonly topics?: {
    readonly added: readonly string[]
    readonly removed: readonly string[]
  }
}

/** GitHub's own cap on the About field. */
const MAX_DESCRIPTION_LENGTH = 350

/** GitHub's own cap on topics per repository. */
const MAX_TOPICS = 20

/** GitHub's own shape for a topic: lowercase, alphanumeric, internal hyphens. */
const TOPIC_PATTERN = /^[a-z0-9][a-z0-9-]*$/

/**
 * Whether an already-trimmed, already-lowercased string is a shape GitHub
 * accepts as a topic. Exported so a caller validating an operator-supplied
 * topic list checks against the same rule this reader silently filters
 * `package.json`'s `keywords` through, rather than reimplementing it against
 * a looser test such as non-emptiness alone.
 */
export function isValidTopic(topic: string): boolean {
  return TOPIC_PATTERN.test(topic)
}

/**
 * A bare image, or an image wrapped in a link, which is the shape a shields.io
 * badge takes. The wrapped alternative goes first, since the bare form would
 * otherwise match its inner image alone and leave the wrapping link behind.
 */
const BADGE_TOKEN = /\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)|!\[[^\]]*\]\([^)]*\)/g

/** True once every badge token is stripped and nothing remains. */
function isBadgeLine(line: string): boolean {
  return line.replace(BADGE_TOKEN, '').trim() === ''
}

function stripInlineMarkdown(line: string): string {
  return line
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(\*|_|`)(.+?)\1/g, '$2')
    .trim()
}

/**
 * The first prose line past the title and any badge row, stripped of inline
 * markdown and capped at GitHub's About field length.
 *
 * `undefined` only when the file carries nothing past its title and badges,
 * per the skill requirement's refusal boundary: a resolvable line that reads
 * as a title rather than a sentence is still proposed, since rejecting it is
 * a judgment for the person reading the proposal rather than for this reader.
 */
export function extractOpeningLine(readme: string): string | undefined {
  for (const raw of readme.split('\n')) {
    const line = raw.trim()
    if (line === '' || line.startsWith('#') || isBadgeLine(line)) continue

    const stripped = stripInlineMarkdown(line)
    if (stripped === '') continue

    return stripped.length > MAX_DESCRIPTION_LENGTH
      ? `${stripped.slice(0, MAX_DESCRIPTION_LENGTH - 1)}…`
      : stripped
  }
  return undefined
}

/**
 * `package.json`'s `keywords` read as candidate topics, the field the wider
 * npm ecosystem already uses for this. Invalid entries are dropped silently
 * rather than refused, since a manifest mixing free-text keywords with
 * topic-shaped ones is ordinary and only the shaped half transfers.
 */
function readTopics(keywords: unknown): readonly string[] | undefined {
  if (!Array.isArray(keywords)) return undefined

  const topics = new Set<string>()
  for (const entry of keywords) {
    if (typeof entry !== 'string') continue
    const topic = entry.trim().toLowerCase()
    if (isValidTopic(topic)) topics.add(topic)
    if (topics.size === MAX_TOPICS) break
  }
  return [...topics]
}

interface PackageFields {
  readonly homepage?: unknown
  readonly keywords?: unknown
}

async function readManifest(root: string): Promise<PackageFields | undefined> {
  try {
    const parsed: unknown = JSON.parse(
      await readFile(join(root, 'package.json'), 'utf8'),
    )
    return (parsed ?? undefined) as PackageFields | undefined
  } catch {
    return undefined
  }
}

/**
 * Computes what this tree can propose for its own repository metadata, with
 * no network call: an About text from the README's opening line, and a
 * homepage and a topic set from `package.json`, the one manifest every
 * target project this ships to already carries.
 *
 * A field a target project declares nowhere stays absent rather than empty,
 * so the caller comparing this against the remote never treats a field this
 * reader has no opinion on as a proposal to clear it.
 */
export async function proposeMetadata(root: string): Promise<MetadataProposal> {
  const [readme, manifest] = await Promise.all([
    readFile(join(root, 'README.md'), 'utf8').catch(() => undefined),
    readManifest(root),
  ])

  const description =
    readme === undefined ? undefined : extractOpeningLine(readme)

  const homepage =
    typeof manifest?.homepage === 'string' && manifest.homepage.trim() !== ''
      ? manifest.homepage.trim()
      : undefined

  const topics = readTopics(manifest?.keywords)

  return {
    ...(description !== undefined && { description }),
    ...(homepage !== undefined && { homepage }),
    ...(topics !== undefined && topics.length > 0 && { topics }),
  }
}

/**
 * Compares a computed proposal against what the remote already carries.
 *
 * A field the proposal has no opinion on is never diffed, which is what
 * keeps a target project with no `keywords` field from seeing every existing
 * topic reported as a removal.
 */
export function compareMetadata(
  current: CurrentMetadata,
  proposed: MetadataProposal,
): MetadataDiff {
  const diff: {
    description?: { current: string; proposed: string }
    homepage?: { current: string; proposed: string }
    topics?: { added: readonly string[]; removed: readonly string[] }
  } = {}

  if (
    proposed.description !== undefined &&
    proposed.description !== current.description
  ) {
    diff.description = {
      current: current.description,
      proposed: proposed.description,
    }
  }

  if (
    proposed.homepage !== undefined &&
    proposed.homepage !== current.homepage
  ) {
    diff.homepage = { current: current.homepage, proposed: proposed.homepage }
  }

  if (proposed.topics !== undefined) {
    const currentSet = new Set(current.topics)
    const proposedSet = new Set(proposed.topics)
    const added = proposed.topics.filter((topic) => !currentSet.has(topic))
    const removed = current.topics.filter((topic) => !proposedSet.has(topic))
    if (added.length > 0 || removed.length > 0) diff.topics = { added, removed }
  }

  return diff
}
