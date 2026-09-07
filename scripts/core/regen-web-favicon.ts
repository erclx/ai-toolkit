/**
 * Writes web/public/favicon.svg from assets/brand/mark.svg and the design
 * source's two accent values.
 *
 * The page is the fourth surface to carry the mark as a favicon and the only
 * one that can answer for itself. `regen-hero.sh` and `src/design/render.ts`
 * each bake a single literal, because both embed the mark as a data URI and a
 * data URI has no CSS context. A file served at its own URL does have one, so
 * this copy carries a `prefers-color-scheme` branch and tracks the reader's
 * theme rather than picking one accent for everybody.
 *
 * `web/public/favicon.svg` was a symlink to the source before this, and the
 * source fills `currentColor`, which resolves to black with no CSS context.
 * That is what painted the tab icon black on every surface the page reaches.
 * The source keeps `currentColor`, since the hero topbar embeds the same file
 * inline and wants it to inherit.
 */
import { writeFileSync } from 'node:fs'

const root = new URL('../..', import.meta.url).pathname

const mark = (await Bun.file(`${root}assets/brand/mark.svg`).text()).trim()
if (!mark) {
  console.error('regen-web-favicon: assets/brand/mark.svg read empty')
  process.exit(1)
}

const tokenCss = await Bun.file(`${root}web/src/styles/tokens.css`).text()
const read = (name: string): string => {
  const match = tokenCss.match(
    new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{3,8})`),
  )
  if (!match) {
    console.error(
      `regen-web-favicon: tokens.css carries no --color-${name}, refusing to write a colorless favicon`,
    )
    process.exit(1)
  }
  return match[1] as string
}

const dark = read('accent')
const light = read('light-accent')

// The shapes only, with the source's authoring comment dropped. Both fills are
// replaced by a rule rather than an attribute so one branch can flip both.
const shapes = mark
  .replace(/<!--[\s\S]*?-->/, '')
  .trim()
  .replace(/^<svg[^>]*>/, '')
  .replace(/<\/svg>$/, '')
  .replaceAll(' fill="currentColor"', '')
  .trim()

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 10 80 80">
  <style>
    path, rect { fill: ${light}; }
    @media (prefers-color-scheme: dark) { path, rect { fill: ${dark}; } }
  </style>
  ${shapes.replace(/\n\s*/g, '\n  ')}
</svg>
`

writeFileSync(`${root}web/public/favicon.svg`, svg)
console.log(
  `regen-web-favicon: wrote web/public/favicon.svg (${light} / ${dark})`,
)
