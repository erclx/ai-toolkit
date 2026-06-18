import { describe, expect, it } from 'vitest'
import {
  type VideoMetadata,
  formatUploadDate,
  renderFrontmatter,
  slugify,
} from '@/transcripts/metadata'

function buildMetadata(overrides: Partial<VideoMetadata> = {}): VideoMetadata {
  return {
    videoId: 'abc123',
    title: 'How Attention Works',
    channel: 'Deep Learning Daily',
    durationSeconds: 372,
    published: '2026-01-14',
    url: 'https://www.youtube.com/watch?v=abc123',
    ...overrides,
  }
}

describe('slugify', () => {
  it('lowercases and hyphenates runs of non-alphanumeric characters', () => {
    expect(slugify('How Attention Works!')).toBe('how-attention-works')
  })

  it('returns untitled when no alphanumeric characters remain', () => {
    expect(slugify('!!!')).toBe('untitled')
  })

  it('truncates to the max length without a trailing hyphen', () => {
    expect(slugify('a'.repeat(60), 10)).toBe('aaaaaaaaaa')
  })
})

describe('formatUploadDate', () => {
  it('formats an 8-digit date as ISO', () => {
    expect(formatUploadDate('20260114')).toBe('2026-01-14')
  })

  it('returns an empty string for malformed input', () => {
    expect(formatUploadDate('2026')).toBe('')
    expect(formatUploadDate(undefined)).toBe('')
  })
})

describe('renderFrontmatter', () => {
  it('escapes double quotes in the title', () => {
    const block = renderFrontmatter(
      buildMetadata({ title: 'A "Quoted" Talk' }),
      {
        hasTranscript: true,
        fetchedAt: '2026-06-18',
      },
    )
    expect(block).toContain('title: "A \\"Quoted\\" Talk"')
  })

  it('emits an empty published line when the date is missing', () => {
    const block = renderFrontmatter(buildMetadata({ published: '' }), {
      hasTranscript: true,
      fetchedAt: '2026-06-18',
    })
    expect(block).toContain('\npublished:\n')
  })

  it('records has_transcript false when there is no transcript', () => {
    const block = renderFrontmatter(buildMetadata(), {
      hasTranscript: false,
      fetchedAt: '2026-06-18',
    })
    expect(block).toContain('has_transcript: false')
  })
})
