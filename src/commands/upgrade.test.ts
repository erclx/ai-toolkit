import { describe, expect, it } from 'vitest'
import { upgradedMessage } from '@/commands/upgrade'

describe('upgradedMessage', () => {
  it('should report the version move when the reinstall changed it', () => {
    expect(upgradedMessage('4.10.0', '4.11.0')).toBe(
      'Upgraded 4.10.0 to 4.11.0.',
    )
  })

  it('should report no change when the reinstall left the version the same', () => {
    expect(upgradedMessage('4.11.0', '4.11.0')).toBe(
      'Reinstalled 4.11.0, unchanged.',
    )
  })
})
