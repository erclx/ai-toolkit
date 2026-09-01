/**
 * The heading whose bullets state what a branch changed.
 *
 * Read alone, and never widened to a sibling section. `## Technical Context`
 * legitimately names files a branch never touched, such as an install stamp
 * inside a target, so a reader that took the whole body would manufacture a
 * finding out of every argument the author made for the change.
 */
export const KEY_CHANGES = 'Key Changes'

/** What one bullet claimed, kept with its bullet so a finding can quote it. */
export interface PathClaim {
  /** Repository-relative, with a trailing slash kept on a directory claim. */
  readonly path: string
  /** True when the span named a folder, which covers every file beneath it. */
  readonly directory: boolean
  /**
   * True when the first segment names an entry the tree actually holds.
   *
   * An unanchored claim is a path written partially, such as
   * `claude-worker/SKILL.md` for a file under `claude/skills/`. It can confirm
   * that a changed file was named and can never accuse one of being absent,
   * because the comparison has no way to tell a partial spelling from a
   * genuinely wrong one.
   */
  readonly anchored: boolean
  /** The span exactly as the body wrote it, before the line suffix came off. */
  readonly span: string
  /** One-based index of the bullet inside the section. */
  readonly bullet: number
  /** The bullet, trimmed, so a finding names the sentence it came from. */
  readonly preview: string
}

export type KeyChangeRead =
  | {
      readonly kind: 'read'
      readonly claims: readonly PathClaim[]
      /** Bullets the section carried, so an empty claim set is separable. */
      readonly bullets: number
    }
  | { readonly kind: 'no-section' }

/** The longest bullet a claim carries forward, matching the citation sweep. */
const PREVIEW_LIMIT = 200

/** A backticked span, the only carrier this corpus writes a path in. */
const BACKTICKED = /`([^`\n]+)`/g

/** A list item at any indent, in either bullet spelling or as an ordinal. */
const BULLET = /^\s*(?:[-*+]|\d+\.)\s+(.*)$/

const FENCE = /^\s*(?:```|~~~)/

const HEADING = /^(#{1,6})\s+(.+?)\s*$/

/**
 * A `file.ts:42` or `file.ts:42-58` suffix, which is a reader's click target
 * rather than part of the name.
 */
const LINE_SUFFIX = /:\d+(?:-\d+)?$/

/**
 * A character that puts the span outside a path this comparison resolves.
 *
 * Whitespace separates a backticked command from a backticked path, and it is
 * the whole answer to one of the four observed false-positive classes:
 * `canon markdown audit .claude/rules --json` carries a slash and names no file.
 * Angle brackets answer a second, since `.canon/plans/feature-<slug>.md`
 * describes a shape rather than naming a file. A glob and a caret describe a
 * shape too, `^src/` being a grep pattern one body spelled in Key Changes, and
 * a leading anchor names something outside this repository.
 *
 * Deliberately not shared with `classifySpan` in `@/gov/citations`, which asks
 * a different question. That sweep resolves what a rule points a reader at,
 * against the filesystem, with a sibling resolving inside the citing rule's own
 * folder. This one resolves what a bullet claims to have changed, against a
 * changed-file list, and it admits a folder where that sweep declines one.
 */
function isNotRepositoryPath(span: string): boolean {
  if (/[\s<>$*|?^]/.test(span)) return true
  if (span.includes('://')) return true
  return /^[/~@#!]/.test(span)
}

/**
 * Whether the span's last segment carries a file extension.
 *
 * The extension has to start with a letter, which is what keeps `127.0.0.1`
 * out. A bare dotted number reaching the comparison is the shape that put
 * `src/serve/127.0.0.1` in a report over a body that was correct.
 */
function hasExtension(span: string): boolean {
  const segment = span.slice(span.lastIndexOf('/') + 1)
  return /\.[A-Za-z][A-Za-z0-9]*$/.test(segment)
}

/** Blanks every backticked span so a cue search never fires inside one. */
function maskSpans(text: string): string {
  return text.replace(/`[^`\n]*`/g, (span) => ' '.repeat(span.length))
}

/**
 * The part of a bullet that asserts a change, which ends at its first comma.
 *
 * This is the one lever that separates a claim from a mention, and it was
 * chosen by measurement rather than by grammar. Over the 23 merged pull
 * requests in this repository that carry the section, reading whole bullets
 * reported 16 paths as claimed-but-untouched and every one of them was a file
 * the body named for context. Cutting at the comma left 110 claims of the
 * original 149 and took the false reports to 2. A list of clause-opening words
 * tried beside it (`which`, `since`, `because`, `rather than`, and eleven more)
 * removed nothing the comma had not already removed, because this corpus
 * punctuates every one of them.
 *
 * What it costs is a claim in a second coordinated clause, as in "Add `x` to
 * `a.ts`, and delete the old inline `y` from `b.ts`", where `b.ts` stops being
 * claimed and falls to the unnamed direction instead. That direction reports
 * without grading, so the cost lands where it does no damage.
 */
function claimRegion(bullet: string): string {
  const at = maskSpans(bullet).indexOf(',')
  return at === -1 ? bullet : bullet.slice(0, at)
}

/**
 * A claim region that asserts nothing changed.
 *
 * A body writes such a bullet to record a decision it declined, and the path it
 * names is the file it deliberately did not touch, which is the exact inverse
 * of a claim. `#1274` opens one with "Leave `...expect.toml` untouched" and the
 * path sits ahead of the first comma, so the region cut cannot reach it: a
 * stricter cut would not catch this and a looser one would find more.
 *
 * The marker rather than the leading verb decides it, because `keep` and
 * `leave` both open a real claim often enough and neither is safe alone. The
 * set is deliberately three words. `in place` was measured and dropped, since
 * rewriting a file in place is an ordinary claim, and `no other line` was
 * dropped because `#1269` writes "as one insertion that touches no other line"
 * about a change it did make. `alone` was in the set and came out on review:
 * every occurrence across the 40-pull-request corpus sits past the first
 * comma, where the region cut already excludes it, so the word caught nothing
 * real there. Kept, it turns restrictive on a comma-free bullet, which is this
 * repository's more common use of the word: "Move the threshold read into
 * `src/gate/stages.ts` alone." asserts an edit and voided to an empty claim
 * set while the word was in the set, unlike the other three, which disclaim
 * wherever they land.
 */
const NO_CHANGE =
  /\b(?:untouched|unchanged)\b|\bas written\b|^\s*(?:do not|don't|never)\b/i

function disclaimsChange(region: string): boolean {
  return NO_CHANGE.test(maskSpans(region))
}

/**
 * The lines under a heading, ending at the next heading of the same level or
 * higher. Undefined when the body carries no such heading, which the caller
 * reports rather than reading as an empty section.
 */
export function readSection(body: string, title: string): string | undefined {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const wanted = title.toLowerCase()

  let start = -1
  let level = 0
  let fenced = false

  for (const [index, line] of lines.entries()) {
    if (FENCE.test(line)) {
      fenced = !fenced
      continue
    }
    if (fenced) continue
    const heading = line.match(HEADING)
    if (heading === null) continue
    if ((heading[2] ?? '').toLowerCase() !== wanted) continue
    start = index + 1
    level = (heading[1] ?? '').length
    break
  }

  if (start === -1) return undefined

  const out: string[] = []
  fenced = false
  for (const line of lines.slice(start)) {
    if (FENCE.test(line)) fenced = !fenced
    const heading = fenced ? null : line.match(HEADING)
    if (heading !== null && (heading[1] ?? '').length <= level) break
    out.push(line)
  }

  return out.join('\n')
}

/**
 * Splits a section into bullets, folding a wrapped continuation line into the
 * bullet above it and starting a new one at every list marker.
 *
 * A nested bullet is its own bullet rather than part of its parent, which keeps
 * one claim region per claim a reader sees.
 */
function splitBullets(section: string): string[] {
  const bullets: string[] = []
  let current: string[] | undefined
  let fenced = false

  for (const line of section.split('\n')) {
    if (FENCE.test(line)) {
      fenced = !fenced
      current?.push(line)
      continue
    }

    const marker = fenced ? null : line.match(BULLET)
    if (marker !== null) {
      if (current !== undefined) bullets.push(current.join(' '))
      current = [marker[1] ?? '']
      continue
    }

    if (current === undefined) continue
    if (!fenced && line.trim() === '') {
      bullets.push(current.join(' '))
      current = undefined
      continue
    }
    current.push(line.trim())
  }

  if (current !== undefined) bullets.push(current.join(' '))
  return bullets
}

/** What one span resolved to, or nothing when it names no comparable path. */
interface ResolvedSpan {
  readonly path: string
  readonly directory: boolean
}

function resolveSpan(span: string): ResolvedSpan | undefined {
  if (span === '' || isNotRepositoryPath(span)) return undefined

  // A bare name is the fourth observed false-positive class and it drops
  // outright. Resolved as a sibling of a path earlier in the bullet it produced
  // seven wrong paths across this corpus against two right ones, because a
  // compound bullet names a sibling folder as often as a sibling file. Dropping
  // it under-reports in the unnamed direction and never fires in the other.
  if (!span.includes('/')) return undefined

  if (span.endsWith('/')) {
    // A single top-level folder is never a claim. Nobody reports having changed
    // the whole of `src/`, and every body that spelled one was naming where
    // something lives.
    return span.indexOf('/') === span.length - 1
      ? undefined
      : { path: span, directory: true }
  }

  return hasExtension(span) ? { path: span, directory: false } : undefined
}

/**
 * Every path the `## Key Changes` section claims a change to.
 *
 * `roots` names the entries the tree holds at its top level, which is what
 * separates a whole path from one written partially. It is passed in rather
 * than read here so the extractor stays a pure function of the body, and there
 * is no default: an absent set would silently mark every claim anchored, which
 * is the direction that accuses.
 *
 * Reports `no-section` rather than an empty read when the heading is absent,
 * and an empty claim set with a bullet count when the heading is there and
 * nothing resolved. The caller needs those apart. A body with no section states
 * nothing, a section that produced no claim is this extractor failing over
 * prose, and only a section that produced claims supports a comparison. An
 * empty extraction read as a clean pass is the failure shape this repository
 * has already recorded twice.
 */
export function extractKeyChangePaths(
  body: string,
  roots: ReadonlySet<string>,
  title: string = KEY_CHANGES,
): KeyChangeRead {
  const section = readSection(body, title)
  if (section === undefined) return { kind: 'no-section' }

  const bullets = splitBullets(section)
  const claims: PathClaim[] = []
  const seen = new Set<string>()

  for (const [index, bullet] of bullets.entries()) {
    const trimmed = bullet.trim()
    const preview =
      trimmed.length > PREVIEW_LIMIT
        ? `${trimmed.slice(0, PREVIEW_LIMIT)}…`
        : trimmed
    const region = claimRegion(trimmed)
    if (disclaimsChange(region)) continue

    let claimed = false

    for (const match of region.matchAll(BACKTICKED)) {
      const span = match[1] ?? ''
      const bare = span.replace(LINE_SUFFIX, '')

      // A `file:line` span following another claim in the same bullet is a
      // citation into a file being described rather than a second claim, which
      // is what "the stages at `verify.sh:634` and `:642`" is doing inside a
      // bullet whose claim is the context entry that describes them. Leading
      // its bullet it is an ordinary claim, which is how a body names the exact
      // line it rewrote.
      const cited = bare !== span
      if (cited && claimed) continue

      const resolved = resolveSpan(bare)
      if (resolved === undefined) continue
      claimed = true
      if (seen.has(resolved.path)) continue
      seen.add(resolved.path)

      claims.push({
        path: resolved.path,
        directory: resolved.directory,
        anchored: roots.has(resolved.path.slice(0, resolved.path.indexOf('/'))),
        span,
        bullet: index + 1,
        preview,
      })
    }
  }

  return { kind: 'read', claims, bullets: bullets.length }
}
