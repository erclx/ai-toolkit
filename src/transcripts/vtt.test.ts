import { describe, expect, it } from 'vitest'
import { dedupeRollingCues, parseVtt, renderBody } from '@/transcripts/vtt'

const SIMPLE_VTT = [
  'WEBVTT',
  '',
  '1',
  '00:00:00.000 --> 00:00:02.000',
  'hello <c>world</c>',
  '',
  '2',
  '00:00:02.000 --> 00:00:04.000',
  'second line',
  '',
].join('\n')

describe('parseVtt', () => {
  it('extracts cue text and timestamp after the header', () => {
    const cues = parseVtt(SIMPLE_VTT)
    expect(cues[0]).toEqual({ timestamp: '00:00:00.000', text: 'hello world' })
  })

  it('strips inline tags and numeric cue-index lines', () => {
    const cues = parseVtt(SIMPLE_VTT)
    expect(cues.map((cue) => cue.text)).toEqual(['hello world', 'second line'])
  })

  it('returns no cues for a header-only file', () => {
    expect(parseVtt('WEBVTT\n\n')).toEqual([])
  })
})

describe('dedupeRollingCues', () => {
  it('removes rolling caption overlap between consecutive cues', () => {
    const cues = [
      { timestamp: '00:00:00.000', text: 'the model reads' },
      { timestamp: '00:00:02.000', text: 'the model reads the prompt' },
    ]
    const deduped = dedupeRollingCues(cues)
    expect(deduped.map((cue) => cue.text)).toEqual([
      'the model reads',
      'the prompt',
    ])
  })

  it('drops a cue that only repeats prior text', () => {
    const cues = [
      { timestamp: '00:00:00.000', text: 'same words' },
      { timestamp: '00:00:02.000', text: 'same words' },
    ]
    expect(dedupeRollingCues(cues)).toHaveLength(1)
  })
})

describe('renderBody', () => {
  it('joins cues into prose by default', () => {
    const cues = [
      { timestamp: '00:00:00.000', text: 'alpha' },
      { timestamp: '00:00:02.000', text: 'beta' },
    ]
    expect(renderBody(cues, { keepTimestamps: false })).toBe('alpha beta\n')
  })

  it('prefixes each line with mm:ss when keepTimestamps is set', () => {
    const cues = [{ timestamp: '00:01:05.000', text: 'tagged' }]
    expect(renderBody(cues, { keepTimestamps: true })).toBe('[01:05] tagged\n')
  })

  it('returns an empty string when there are no cues', () => {
    expect(renderBody([], { keepTimestamps: false })).toBe('')
  })
})
