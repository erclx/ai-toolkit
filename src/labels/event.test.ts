import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resolveScanInput } from '@/labels/event'

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'canon-labels-event-'))
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

function eventFile(payload: unknown): string {
  const path = join(dir, 'event.json')
  writeFileSync(path, JSON.stringify(payload))
  return path
}

describe('resolveScanInput', () => {
  it('should scan review.body rather than pull_request.body on a pull_request_review payload', () => {
    const path = eventFile({
      review: { body: 'the review text' },
      pull_request: {
        title: 'feat: add x',
        body: 'the pull request body',
        head: { ref: 'feat/x' },
      },
    })

    const result = resolveScanInput({ event: path })

    expect(result).toEqual({
      kind: 'resolved',
      title: '',
      body: 'the review text',
      headRefName: 'feat/x',
      source: 'review',
    })
  })

  it('should resolve a review.body of null as an empty, clean body rather than refusing', () => {
    const path = eventFile({
      review: { body: null },
      pull_request: { title: 'feat: add x', head: { ref: 'feat/x' } },
    })

    const result = resolveScanInput({ event: path })

    expect(result).toEqual({
      kind: 'resolved',
      title: '',
      body: '',
      headRefName: 'feat/x',
      source: 'review',
    })
  })

  it('should refuse unreadable-review when review.body is present as neither a string nor null', () => {
    const path = eventFile({
      review: { body: 42 },
      pull_request: { title: 'feat: add x', body: 'ignored', head: {} },
    })

    const result = resolveScanInput({ event: path })

    expect(result.kind).toBe('refused')
    expect(result.kind === 'refused' && result.reason).toBe('unreadable-review')
  })

  it('should resolve an ordinary pull_request payload unchanged, reporting source pull-request', () => {
    const path = eventFile({
      pull_request: {
        title: 'feat: add the phase label gate',
        body: 'Planned under v59.7.',
        head: { ref: 'feat/phase-label-gate' },
      },
    })

    const result = resolveScanInput({ event: path })

    expect(result).toEqual({
      kind: 'resolved',
      title: 'feat: add the phase label gate',
      body: 'Planned under v59.7.',
      headRefName: 'feat/phase-label-gate',
      source: 'pull-request',
    })
  })

  it('should refuse not-a-pull-request when the payload carries neither pull_request nor review', () => {
    const path = eventFile({ action: 'opened' })

    const result = resolveScanInput({ event: path })

    expect(result.kind).toBe('refused')
    expect(result.kind === 'refused' && result.reason).toBe(
      'not-a-pull-request',
    )
  })

  it('should refuse unreadable-event when the path does not resolve', () => {
    const result = resolveScanInput({ event: join(dir, 'missing.json') })

    expect(result.kind).toBe('refused')
    expect(result.kind === 'refused' && result.reason).toBe('unreadable-event')
  })

  it('should refuse unreadable-event when the file is not valid JSON', () => {
    const path = join(dir, 'event.json')
    writeFileSync(path, 'not json')

    const result = resolveScanInput({ event: path })

    expect(result.kind).toBe('refused')
    expect(result.kind === 'refused' && result.reason).toBe('unreadable-event')
  })

  it('should refuse no-input when neither an event, a title, nor a body is given', () => {
    const result = resolveScanInput({})

    expect(result.kind).toBe('refused')
    expect(result.kind === 'refused' && result.reason).toBe('no-input')
  })

  it('should resolve on --body alone, with an empty title, exercising the review-style path by hand', () => {
    const result = resolveScanInput({ body: 'planned under v59.7' })

    expect(result).toEqual({
      kind: 'resolved',
      title: '',
      body: 'planned under v59.7',
      headRefName: '',
      source: 'pull-request',
    })
  })

  it('should let an explicit --title override the title read from an event payload', () => {
    const path = eventFile({
      pull_request: { title: 'from the event', body: '', head: {} },
    })

    const result = resolveScanInput({ event: path, title: 'from the flag' })

    expect(result).toEqual({
      kind: 'resolved',
      title: 'from the flag',
      body: '',
      headRefName: '',
      source: 'pull-request',
    })
  })

  it('should report source pull-request, not review, when --body overrides a review payload', () => {
    const path = eventFile({
      review: { body: 'from the event' },
      pull_request: { head: { ref: 'feat/x' } },
    })

    const result = resolveScanInput({ event: path, body: 'from the flag' })

    expect(result).toEqual({
      kind: 'resolved',
      title: '',
      body: 'from the flag',
      headRefName: 'feat/x',
      source: 'pull-request',
    })
  })

  it('should resolve the body from --body-file', () => {
    const path = join(dir, 'body.md')
    writeFileSync(path, 'the file body')

    const result = resolveScanInput({ bodyFile: path })

    expect(result).toEqual({
      kind: 'resolved',
      title: '',
      body: 'the file body',
      headRefName: '',
      source: 'pull-request',
    })
  })

  it('should refuse unreadable-body-file when the path does not resolve', () => {
    const result = resolveScanInput({ bodyFile: join(dir, 'missing.md') })

    expect(result.kind).toBe('refused')
    expect(result.kind === 'refused' && result.reason).toBe(
      'unreadable-body-file',
    )
  })

  it('should refuse conflicting-body-input when --body and --body-file are both given', () => {
    const path = join(dir, 'body.md')
    writeFileSync(path, 'the file body')

    const result = resolveScanInput({ body: 'from the flag', bodyFile: path })

    expect(result.kind).toBe('refused')
    expect(result.kind === 'refused' && result.reason).toBe(
      'conflicting-body-input',
    )
  })

  it('should let --body-file override an event payload body the same way --body already does', () => {
    const bodyPath = join(dir, 'body.md')
    writeFileSync(bodyPath, 'from the file')
    const eventPath = eventFile({
      review: { body: 'from the event' },
      pull_request: { head: { ref: 'feat/x' } },
    })

    const result = resolveScanInput({
      event: eventPath,
      bodyFile: bodyPath,
    })

    expect(result).toEqual({
      kind: 'resolved',
      title: '',
      body: 'from the file',
      headRefName: 'feat/x',
      source: 'pull-request',
    })
  })
})
