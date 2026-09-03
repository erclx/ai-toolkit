import { type BodyLine, LINK, maskCodeSpans } from '@/markdown/scan'

export interface LinkFinding {
  readonly line: number
  readonly column: number
  readonly destination: string
}

const SCHEME = /^[a-z][a-z0-9+.-]*:/

function isSkipped(destination: string): boolean {
  return (
    destination === '' ||
    SCHEME.test(destination) ||
    destination.startsWith('#') ||
    destination.startsWith('/') ||
    destination.includes('<')
  )
}

/**
 * The path half of a destination, decoded, or undefined on a malformed
 * percent-encoding.
 *
 * `decodeURIComponent` throws on a stray `%` not followed by two hex digits,
 * and a destination is text an author typed rather than a value this command
 * controls, so a throw here is reachable from any markdown file in the
 * corpus. Exported so `src/commands/markdown.ts` decodes a destination for
 * display the same way this decodes one for resolution, rather than a second
 * definition of the same fallible call.
 */
export function decodePath(destination: string): string | undefined {
  try {
    return decodeURIComponent(destination.split('#')[0] ?? '')
  } catch {
    return undefined
  }
}

/**
 * Reports a relative link whose destination resolves to nothing on disk.
 *
 * `exists` stays injected rather than calling `existsSync` here, so a test
 * asserts against a fake corpus rather than real paths on disk.
 */
export function findBrokenLinks(
  lines: readonly BodyLine[],
  exists: (path: string) => boolean,
): LinkFinding[] {
  const found: LinkFinding[] = []

  for (const line of lines) {
    if (line.fenced) continue
    const text = maskCodeSpans(line.text)

    for (const match of text.matchAll(LINK)) {
      const open = match[0].indexOf('](')
      const destination = match[0].slice(open + 2, -1)
      if (isSkipped(destination)) continue

      const path = decodePath(destination)
      if (path !== undefined && exists(path)) continue

      found.push({
        line: line.number,
        column: (match.index ?? 0) + open + 2,
        destination,
      })
    }
  }

  return found
}
