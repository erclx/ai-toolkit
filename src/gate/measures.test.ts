import { describe, expect, it } from 'vitest'
import { BASELINE_REL } from '@/audits/baseline'
import { AUDITS_BASELINE } from '@/gate/measures'

describe('AUDITS_BASELINE', () => {
  it('should agree with the path audits/baseline.ts writes', () => {
    expect(AUDITS_BASELINE).toBe(BASELINE_REL)
  })
})
