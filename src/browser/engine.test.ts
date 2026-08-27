import { describe, expect, it } from 'vitest'
import { isBrowserMissing, isEngineMissing } from '@/browser/engine'

describe('isBrowserMissing', () => {
  it('should report a binary that was never downloaded', () => {
    const error = new Error(
      "browserType.launch: Executable doesn't exist at /home/x/.cache/ms-playwright/chromium-1200/chrome",
    )

    expect(isBrowserMissing(error)).toBe(true)
  })

  it('should report the install instruction the engine raises on its own', () => {
    const error = new Error(
      'Looks like Playwright was installed or updated. Please run the following command to download new browsers: playwright install',
    )

    expect(isBrowserMissing(error)).toBe(true)
  })

  it('should not report a launch that failed for any other reason', () => {
    const error = new Error('browserType.launch: Target page crashed')

    expect(isBrowserMissing(error)).toBe(false)
  })

  it('should read a thrown value that is not an error', () => {
    expect(isBrowserMissing("Executable doesn't exist at /tmp/chrome")).toBe(
      true,
    )
    expect(isBrowserMissing(undefined)).toBe(false)
  })
})

describe('isEngineMissing', () => {
  it('should report the package failing to resolve', () => {
    expect(isEngineMissing({ code: 'ERR_MODULE_NOT_FOUND' })).toBe(true)
  })

  it('should not report a defect raised from inside the module', () => {
    expect(isEngineMissing(new TypeError('cursors is not a function'))).toBe(
      false,
    )
    expect(isEngineMissing(null)).toBe(false)
  })
})
