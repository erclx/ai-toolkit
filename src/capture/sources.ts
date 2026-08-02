import { readdirSync, statSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'

export interface CaptureSource {
  htmlPath: string
  pngPath: string
}

/**
 * Pairs each HTML source with the PNG it renders to. A directory expands to
 * every `.html` directly inside it, so adding a capture is a file drop rather
 * than a flag. Omitting `outDir` writes the PNG beside its source.
 */
export function resolveCaptureSources(
  sourcePath: string,
  outDir?: string,
): CaptureSource[] {
  const htmlPaths = statSync(sourcePath).isDirectory()
    ? readdirSync(sourcePath)
        .filter((name) => extname(name) === '.html')
        .sort()
        .map((name) => join(sourcePath, name))
    : [sourcePath]

  return htmlPaths.map((htmlPath) => ({
    htmlPath,
    pngPath: join(
      outDir ?? dirname(htmlPath),
      `${basename(htmlPath, '.html')}.png`,
    ),
  }))
}

/**
 * Reads the first family from a computed `font-family` value, which is the font
 * the source asks for and the one a capture has to prove resolved. Quoting is
 * the source's choice, so both spellings arrive here.
 */
export function primaryFontFamily(declaration: string): string {
  const first = declaration.split(',')[0]?.trim() ?? ''
  return first.replace(/^['"]|['"]$/g, '')
}
