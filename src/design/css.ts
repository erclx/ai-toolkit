import { COMPONENTS } from '@/design/components'
import type { DesignTokens } from '@/design/tokens'
import { TOKENS } from '@/design/tokens'

/**
 * The form a CSS surface takes the source in. Custom properties carry the token
 * layer and plain rules carry the component layer, which is the whole of what a
 * stylesheet needs from `@/design/tokens` and `@/design/components`.
 *
 * The property names match the ones `@/design/render` already emits from a
 * parsed document, so the toolkit's own source and a target's hand-authored
 * `.claude/DESIGN.md` produce one vocabulary rather than two.
 */

/** A role name as it appears in a custom property. */
export function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Only a value a browser can render becomes a property. ANSI codes do not. */
function hasHexValue(value: string): boolean {
  return value !== '' && !value.startsWith('ANSI')
}

/**
 * Dark role each `light-` role stands in for. Read off the names rather than
 * declared twice, so a light role added to the record joins the theme block
 * with no edit here.
 */
function lightCounterparts(tokens: DesignTokens): Map<string, string> {
  const roles = new Set(tokens.color.map((token) => token.role))
  const pairs = new Map<string, string>()

  for (const token of tokens.color) {
    if (!token.role.startsWith('light-')) continue
    const dark = token.role.slice('light-'.length)
    if (roles.has(dark)) pairs.set(dark, token.role)
  }

  return pairs
}

/**
 * Text roles with no light counterpart, named in the emitted stylesheet rather
 * than filled in. Inventing a value for one would put a color in the system
 * that no surface ever read off anything, which is the failure this whole
 * consolidation exists to end.
 */
export function unmappedOnLight(tokens: DesignTokens = TOKENS): string[] {
  const pairs = lightCounterparts(tokens)

  return tokens.color
    .filter(
      (token) =>
        !token.role.startsWith('light-') &&
        hasHexValue(token.value) &&
        !pairs.has(token.role),
    )
    .map((token) => token.role)
}

function tokenProperties(tokens: DesignTokens): string[] {
  const lines: string[] = []

  for (const token of tokens.color) {
    if (!hasHexValue(token.value)) continue
    lines.push(`  --color-${slug(token.role)}: ${token.value};`)
  }

  for (const step of tokens.spacing) {
    lines.push(`  --space-${slug(step.step)}: ${step.value};`)
  }

  for (const role of tokens.typography) {
    lines.push(`  --type-${slug(role.role)}-size: ${role.size};`)
    lines.push(`  --type-${slug(role.role)}-lh: ${role.lineHeight};`)
  }

  for (const border of tokens.borders) {
    if (border.radius === 'none') continue
    lines.push(`  --radius-${slug(border.role)}: ${border.radius};`)
  }

  return lines
}

/**
 * The light theme, as a remap of the roles the record declares a `light-`
 * counterpart for. A consumer that never opts in renders the dark set, which is
 * what every surface here does today.
 */
function lightBlock(tokens: DesignTokens): string {
  const pairs = [...lightCounterparts(tokens)]
    .map(
      ([dark, light]) =>
        `  --color-${slug(dark)}: var(--color-${slug(light)});`,
    )
    .join('\n')

  const gap = unmappedOnLight(tokens)
  const notice =
    gap.length === 0
      ? ''
      : `/* The record declares no light counterpart for ${gap.join(', ')}, so\n   a light-ground surface using one is reading a dark value. Declare the\n   counterpart in src/design/tokens.ts rather than overriding it here. */\n`

  return `${notice}[data-theme='light'] {
${pairs}
}`
}

function componentBlock(): string {
  return COMPONENTS.map(
    (component) => `/* ${component.name}
   ${component.note} */

${component.rules}`,
  ).join('\n\n')
}

export interface CssOptions {
  /** Prepended as a comment, naming what wrote the file and from where. */
  readonly banner?: string
  /** Component rules ride along by default; a token-only consumer opts out. */
  readonly components?: boolean
}

export function buildDesignCss(
  tokens: DesignTokens = TOKENS,
  options: CssOptions = {},
): string {
  const banner =
    options.banner === undefined ? '' : `/* ${options.banner} */\n\n`
  const root = [':root {', ...tokenProperties(tokens), '}'].join('\n')
  const parts = [root, lightBlock(tokens)]

  if (options.components !== false) parts.push(componentBlock())

  return `${banner}${parts.join('\n\n')}\n`
}
