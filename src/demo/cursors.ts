import type { CursorSet } from '@/demo/pointer'

/**
 * The bundled pointer artwork, drawn as vector markup rather than read from a
 * theme on disk. Spike 3 proved the browser decodes a Windows cursor resource
 * directly, so `--cursor` points at a theme folder and gets that path instead.
 * This set is what makes the command work in a target that has no theme to
 * point at, which is every target on first run.
 *
 * Each drawing sits in a 48 by 48 box so one hotspot scale factor covers the
 * set, and each carries a drop shadow so it stays visible over a light surface
 * and a dark one.
 */

const SHADOW =
  '<filter id="s" x="-50%" y="-50%" width="200%" height="200%">' +
  '<feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-opacity="0.45"/></filter>'

function svg(body: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">${SHADOW}<g filter="url(#s)">${body}</g></svg>`,
  )}`
}

const STROKE = 'fill="#ffffff" stroke="#1b1b1b" stroke-width="2.2"'

/**
 * Hotspots are stated against the 48 by 48 box each drawing uses, so the
 * pointer scales them the same way it scales a hotspot read off a real cursor
 * resource. Skipping the scale offsets the artwork by roughly a third of a
 * cursor, which is the defect spike 3 recorded.
 */
export const DEFAULT_CURSORS: CursorSet = {
  default: {
    image: svg(
      `<path ${STROKE} d="M5 3 L5 35 L13.5 27 L19 39.5 L25 37 L19.5 25 L31 24.5 Z"/>`,
    ),
    hotspot: { width: 48, height: 48, hotspotX: 5, hotspotY: 3 },
  },
  pointer: {
    image: svg(
      `<path ${STROKE} d="M18 4 a3.2 3.2 0 0 1 6.4 0 v14 a3 3 0 0 1 5.6 0 v2 a3 3 0 0 1 5.6 0 v2 a3 3 0 0 1 5.4 0 v9 a12 12 0 0 1 -12 12 h-6 a12 12 0 0 1 -12 -12 v-9 a3.2 3.2 0 0 1 6.4 0 z"/>`,
    ),
    hotspot: { width: 48, height: 48, hotspotX: 21, hotspotY: 4 },
  },
  // Drawn as one filled outline rather than three stroked segments. A stroked
  // version needs its own fill, and a second fill attribute on a path carrying
  // STROKE makes the markup invalid, which renders as a broken image.
  text: {
    image: svg(
      `<path ${STROKE} d="M18 5 h12 v3.5 h-4 v31 h4 V43 h-12 v-3.5 h4 v-31 h-4 z"/>`,
    ),
    hotspot: { width: 48, height: 48, hotspotX: 24, hotspotY: 24 },
  },
}
