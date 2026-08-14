import { createHash } from 'node:crypto'
import { basename, dirname, extname, join } from 'node:path'

const HASH_ALGORITHM = 'sha256'
const STAMP_EXTENSION = '.stamp'

/**
 * Provenance for one rendered PNG: the markup it came from and the digest of
 * that markup's exact bytes. `assert_hero_stamp` in `scripts/core/verify.sh`
 * reads the digest back with awk, so the field names, the colon, and the single
 * space after it are a contract across two languages rather than formatting.
 */
export interface CaptureStamp {
  readonly source: string
  readonly sha256: string
}

/**
 * A capture writes its stamp beside its PNG rather than beside its HTML,
 * because `--out` moves the image away from the source and the stamp answers a
 * question about the image.
 */
export function stampPath(pngPath: string): string {
  return join(
    dirname(pngPath),
    `${basename(pngPath, extname(pngPath))}${STAMP_EXTENSION}`,
  )
}

/**
 * Digests the whole file rather than the counts inside it. A template edit
 * changes what the image shows without moving any count, and the whole point of
 * the stamp is that it needs no knowledge of what the markup renders.
 */
export function hashSource(bytes: Uint8Array): string {
  return createHash(HASH_ALGORITHM).update(bytes).digest('hex')
}

export function formatStamp(stamp: CaptureStamp): string {
  return `source: ${stamp.source}\nsha256: ${stamp.sha256}\n`
}
