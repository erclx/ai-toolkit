import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cursorHotspot, type Cursor, type CursorSet } from '@/demo/pointer'

/**
 * Reads a cursor theme folder so `--cursor` can point at one. Spike 3 measured
 * the browser decoding a Windows cursor resource directly, so nothing here
 * converts anything: the bytes go into a data URI and the header supplies the
 * hotspot.
 *
 * Three of the nineteen states a theme carries are read. A drag, a resize, or a
 * wait shows the default arrow where a real session would show something else,
 * and the two animated states have no still frame to draw at all.
 */

const CURSOR_MIME = 'image/x-icon'
const EXTENSION = /\.cur$/i

/** Ordered per state, most specific first, so an exact name beats a longer one. */
const NAMES: Record<string, readonly string[]> = {
  default: ['arrow', 'normal', 'default'],
  pointer: ['link', 'hand', 'pointer'],
  text: ['ibeam', 'beam', 'text'],
}

export type CursorFiles = Partial<Record<string, string>>

/**
 * Picks one file per state out of a directory listing. Matching runs on the
 * name rather than on the contents because a theme states its intent there, and
 * a shorter match wins so `Arrow.cur` beats `Arrow Alternate.cur`.
 */
export function matchCursorFiles(files: readonly string[]): CursorFiles {
  const cursors = files.filter((file) => EXTENSION.test(file))
  const matched: CursorFiles = {}

  for (const [state, names] of Object.entries(NAMES)) {
    const found = names
      .flatMap((name) =>
        cursors.filter((file) => file.toLowerCase().includes(name)),
      )
      .sort((left, right) => left.length - right.length)[0]
    if (found) matched[state] = found
  }

  return matched
}

export type ThemeLoad =
  | { status: 'loaded'; cursors: CursorSet; states: string[] }
  | { status: 'failed'; reason: string }

/**
 * Falls back to the bundled artwork per state rather than per theme, so a
 * folder carrying an arrow and no hand still contributes its arrow.
 */
export function loadCursorTheme(dir: string, fallback: CursorSet): ThemeLoad {
  let listing: string[]
  try {
    listing = readdirNames(dir)
  } catch (error) {
    return {
      status: 'failed',
      reason: `${dir} could not be read: ${message(error)}`,
    }
  }

  const matched = matchCursorFiles(listing)
  const states = Object.keys(matched)
  if (!states.length) {
    return {
      status: 'failed',
      reason: `${dir} holds no .cur file named after a pointer, link, or text state`,
    }
  }

  const cursors: Record<string, Cursor> = { ...fallback }
  for (const [state, file] of Object.entries(matched)) {
    if (!file) continue
    const loaded = readCursor(join(dir, file))
    if (loaded) cursors[state] = loaded
  }

  return { status: 'loaded', cursors, states }
}

function readCursor(path: string): Cursor | undefined {
  let bytes: Uint8Array
  try {
    bytes = readFileSync(path)
  } catch {
    return undefined
  }

  const hotspot = cursorHotspot(bytes)
  if (!hotspot) return undefined

  return {
    image: `data:${CURSOR_MIME};base64,${Buffer.from(bytes).toString('base64')}`,
    hotspot,
  }
}

function readdirNames(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
