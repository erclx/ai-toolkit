const SLUG_FALLBACK = 'general'
const SLUG_MAX_LENGTH = 40
const TITLE_MAX_LENGTH = 72

function surfaceField(body: string): string | undefined {
  return body.match(/\*\*Surface:\*\*\s*([^\n]+)/i)?.[1]?.trim()
}

export function deriveSlug(body: string): string {
  const slug = (surfaceField(body) ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, '')
  return slug || SLUG_FALLBACK
}

export function deriveTitle(body: string): string {
  const surface = surfaceField(body)
  const title = surface ? `feedback: ${surface}` : 'toolkit feedback'
  return title.slice(0, TITLE_MAX_LENGTH)
}
