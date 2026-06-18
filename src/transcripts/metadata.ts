export interface VideoMetadata {
  readonly videoId: string
  readonly title: string
  readonly channel: string
  readonly durationSeconds: number
  readonly published: string
  readonly url: string
}

const SLUG_PATTERN = /[^a-z0-9]+/g

export function slugify(text: string, maxLength = 50): string {
  const cleaned = text
    .toLowerCase()
    .replace(SLUG_PATTERN, '-')
    .replace(/(^-|-$)/g, '')
  if (!cleaned) return 'untitled'
  return cleaned.slice(0, maxLength).replace(/-$/, '') || 'untitled'
}

export function formatUploadDate(yyyymmdd: string | undefined): string {
  if (!yyyymmdd || yyyymmdd.length !== 8 || !/^\d{8}$/.test(yyyymmdd)) return ''
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6)}`
}

function yamlEscape(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

interface FrontmatterOptions {
  readonly hasTranscript: boolean
  readonly fetchedAt: string
}

export function renderFrontmatter(
  video: VideoMetadata,
  { hasTranscript, fetchedAt }: FrontmatterOptions,
): string {
  const lines = [
    '---',
    `title: ${yamlEscape(video.title)}`,
    `channel: ${yamlEscape(video.channel)}`,
    `video_id: ${video.videoId}`,
    `url: ${video.url}`,
    `duration: ${video.durationSeconds}`,
    video.published ? `published: ${video.published}` : 'published:',
    `fetched_at: ${fetchedAt}`,
    `has_transcript: ${hasTranscript ? 'true' : 'false'}`,
    '---',
    '',
    '',
  ]
  return lines.join('\n')
}
