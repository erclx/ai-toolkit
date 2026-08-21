import { describe, expect, it } from 'vitest'
import { matchLine, PATTERNS } from '@/secrets/patterns'

function ids(line: string): string[] {
  return matchLine(line).map((hit) => hit.pattern)
}

describe('PATTERNS', () => {
  it('should carry a unique id for every rule', () => {
    const seen = PATTERNS.map((pattern) => pattern.id)

    expect(new Set(seen).size).toBe(seen.length)
  })

  it('should key on a value and never on the word beside it', () => {
    const words = [
      'const password = process.env.PASSWORD',
      'api_key: ${{ secrets.API_KEY }}',
      'Set your token before running the deploy.',
      'AWS_SECRET_ACCESS_KEY is read from the environment.',
    ]

    expect(words.flatMap(ids)).toEqual([])
  })
})

describe('matchLine', () => {
  it('should report an AWS access key id', () => {
    expect(ids(`id = "AKIA${'Q'.repeat(16)}"`)).toEqual(['aws-access-key-id'])
  })

  it('should report a GitHub personal access token', () => {
    expect(ids('token: ghp_' + 'a'.repeat(36))).toEqual(['github-token'])
  })

  it('should report a Google API key', () => {
    expect(ids('key=AIza' + 'b'.repeat(35))).toEqual(['google-api-key'])
  })

  it('should report a Slack bot token', () => {
    expect(ids('xoxb-1234567890-1234567890-abcdefghijklm')).toEqual([
      'slack-token',
    ])
  })

  it('should report a Stripe live secret key', () => {
    expect(ids('sk_live_' + 'c'.repeat(24))).toEqual(['stripe-secret-key'])
  })

  it('should report an npm token', () => {
    expect(
      ids('//registry.npmjs.org/:_authToken=npm_' + 'd'.repeat(36)),
    ).toEqual(['npm-token'])
  })

  it('should report a private key header', () => {
    expect(ids('-----BEGIN' + ' RSA PRIVATE KEY-----')).toEqual([
      'private-key-block',
    ])
  })

  it('should report the column the value starts at', () => {
    const [hit] = matchLine(`  id = "AKIA${'Q'.repeat(16)}"`)

    expect(hit?.column).toBe(9)
  })

  it('should redact the value it reports', () => {
    const [hit] = matchLine(`id = "AKIA${'Q'.repeat(16)}"`)

    expect(hit?.preview).toBe('AKIA…QQQQ')
  })

  it('should not report a placeholder too short for its shape', () => {
    expect(ids(`id = "AKIA${'Q'.repeat(8)}"`)).toEqual([])
  })

  it('should not report an environment reference to a key', () => {
    expect(ids('key: ${GOOGLE_API_KEY}')).toEqual([])
  })

  it('should report every distinct value on one line', () => {
    const line = `a=ghp_${'a'.repeat(36)} b=AIza${'b'.repeat(35)}`

    expect(ids(line)).toEqual(['github-token', 'google-api-key'])
  })
})
