import { describe, expect, it } from 'vitest'
import { singleLine, upgradedMessage } from '@/commands/upgrade'

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

describe('singleLine', () => {
  it('should swap a double quote for an apostrophe', () => {
    expect(
      singleLine('Unexpected token \'<\', "<html>..." is not valid JSON'),
    ).toBe("Unexpected token '<', '<html>...' is not valid JSON")
  })

  it('should collapse embedded newlines and repeated whitespace to one space', () => {
    expect(singleLine('line one\nline   two')).toBe('line one line two')
  })

  it('should leave ordinary text unchanged', () => {
    expect(singleLine('Installed 4.11.0, which is the newest published.')).toBe(
      'Installed 4.11.0, which is the newest published.',
    )
  })
})
