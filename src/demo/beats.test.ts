import { describe, expect, it } from 'vitest'
import { parseDraft } from '@/demo/beats'

const DRAFT = `# Screencast: Inline edit launch

## 1. Header

- Audience: technical peers

## 3. Beat sheet

### Beat 1: Cold open

- On screen: The empty board
- Action: navigate
- Watch for: The board paints before anything moves
- Emphasis: zoom 1.4x
- Caption: Nothing on the board yet

### Beat 2: Hero moment

- On screen: A card mid-edit
- Action: type
- Watch for: The title commits without a save button
- Emphasis: highlight overlay
- Caption:
- Transition out: hard cut

## 4. Sequencing notes

- Hover before click.
`

describe('parseDraft', () => {
  it('should read the title from the screencast heading', () => {
    const parsed = parseDraft(DRAFT)

    expect(parsed).toMatchObject({
      status: 'parsed',
      draft: { title: 'Inline edit launch' },
    })
  })

  it('should read every beat under the beat sheet section', () => {
    const parsed = parseDraft(DRAFT)

    expect(parsed.status === 'parsed' && parsed.draft.beats).toHaveLength(2)
  })

  it('should map each labelled line onto its field', () => {
    const parsed = parseDraft(DRAFT)

    expect(parsed.status === 'parsed' && parsed.draft.beats[0]).toEqual({
      index: 1,
      name: 'Cold open',
      onScreen: 'The empty board',
      action: 'navigate',
      watchFor: 'The board paints before anything moves',
      emphasis: 'zoom 1.4x',
      caption: 'Nothing on the board yet',
    })
  })

  it('should carry a transition out only when the beat states one', () => {
    const parsed = parseDraft(DRAFT)

    expect(parsed.status === 'parsed' && parsed.draft.beats[1]).toMatchObject({
      transitionOut: 'hard cut',
    })
  })

  it('should read an empty field as an empty string rather than dropping it', () => {
    const parsed = parseDraft(DRAFT)

    expect(parsed.status === 'parsed' && parsed.draft.beats[1]?.caption).toBe(
      '',
    )
  })

  it('should stop reading beats at the next section heading', () => {
    const parsed = parseDraft(DRAFT)

    expect(
      parsed.status === 'parsed' && parsed.draft.beats.map((beat) => beat.name),
    ).toEqual(['Cold open', 'Hero moment'])
  })

  it('should refuse a draft carrying no beat sheet section', () => {
    const parsed = parseDraft('# Screencast: Empty\n\n## 1. Header\n')

    expect(parsed).toEqual({
      status: 'failed',
      reason: 'no "Beat sheet" section, so the draft carries no beats to run',
    })
  })

  it('should refuse a beat sheet holding no beat', () => {
    const parsed = parseDraft('# Screencast: Empty\n\n## 3. Beat sheet\n')

    expect(parsed).toEqual({
      status: 'failed',
      reason: 'the beat sheet holds no "### Beat" heading',
    })
  })

  it('should title an untitled draft after nothing rather than inventing one', () => {
    const parsed = parseDraft('## 3. Beat sheet\n\n### Beat 1: Only\n')

    expect(parsed).toMatchObject({ status: 'parsed', draft: { title: '' } })
  })
})
