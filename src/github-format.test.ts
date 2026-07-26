import { describe, expect, it } from 'vitest'
import { buildIssueArgs } from '@/github-format'

describe('buildIssueArgs', () => {
  it('builds title and body args with no labels', () => {
    const args = buildIssueArgs({ title: 'A bug', body: 'It broke' })
    expect(args).toEqual([
      'issue',
      'create',
      '--title',
      'A bug',
      '--body',
      'It broke',
    ])
  })

  it('appends one --label flag per label', () => {
    const args = buildIssueArgs({
      title: 'A bug',
      body: 'It broke',
      labels: ['bug', 'enhancement'],
    })
    expect(args).toEqual([
      'issue',
      'create',
      '--title',
      'A bug',
      '--body',
      'It broke',
      '--label',
      'bug',
      '--label',
      'enhancement',
    ])
  })

  it('treats an empty labels array as no labels', () => {
    const args = buildIssueArgs({
      title: 'A bug',
      body: 'It broke',
      labels: [],
    })
    expect(args).not.toContain('--label')
  })
})
