import { describe, expect, it } from 'vitest'
import { liveness, type LivenessProbes } from '@/sessions/live'
import type { SessionRecord } from '@/sessions/registry'

function record(fields: Partial<SessionRecord> = {}): SessionRecord {
  return {
    pid: 100,
    sessionId: 'id-100',
    cwd: '/repo',
    name: 'canon-aa',
    kind: 'interactive',
    status: 'idle',
    statusUpdatedAt: undefined,
    updatedAt: undefined,
    startedAt: 1,
    procStart: '5000',
    ...fields,
  }
}

function probes(fields: Partial<LivenessProbes> = {}): LivenessProbes {
  return {
    procStartOf: () => null,
    responds: () => false,
    ...fields,
  }
}

describe('liveness', () => {
  it('should confirm a session whose start time matches the running process', () => {
    const state = liveness(record(), probes({ procStartOf: () => '5000' }))

    expect(state).toEqual({ alive: true, confidence: 'confirmed' })
  })

  it('should reject a pid whose start time disagrees with the record', () => {
    const state = liveness(record(), probes({ procStartOf: () => '9999' }))

    expect(state).toEqual({ alive: false, confidence: 'confirmed' })
  })

  it('should fall back to the signal probe where start times cannot be read', () => {
    const state = liveness(record(), probes({ responds: () => true }))

    expect(state).toEqual({ alive: true, confidence: 'unverified' })
  })

  it('should report a dead pid as dead on the fallback path', () => {
    const state = liveness(record(), probes({ responds: () => false }))

    expect(state).toEqual({ alive: false, confidence: 'unverified' })
  })

  it('should fall back where the record stamped no start time', () => {
    const state = liveness(
      record({ procStart: undefined }),
      probes({ procStartOf: () => '5000', responds: () => true }),
    )

    expect(state).toEqual({ alive: true, confidence: 'unverified' })
  })
})
