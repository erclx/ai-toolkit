import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mintSandboxRunId, sandboxTree } from '@/sandbox/tree'

const SAVED = {
  AITK_SANDBOX_DIR: process.env.AITK_SANDBOX_DIR,
  AITK_SANDBOX_RUN_ID: process.env.AITK_SANDBOX_RUN_ID,
  XDG_STATE_HOME: process.env.XDG_STATE_HOME,
}

function restore(key: keyof typeof SAVED): void {
  const value = SAVED[key]
  if (value === undefined) delete process.env[key]
  else process.env[key] = value
}

beforeEach(() => {
  delete process.env.AITK_SANDBOX_DIR
  delete process.env.AITK_SANDBOX_RUN_ID
  process.env.XDG_STATE_HOME = '/xdg'
})

afterEach(() => {
  restore('AITK_SANDBOX_DIR')
  restore('AITK_SANDBOX_RUN_ID')
  restore('XDG_STATE_HOME')
})

describe('sandboxTree', () => {
  it('should prefer the explicit override over the per-run default', () => {
    process.env.AITK_SANDBOX_DIR = '/explicit'

    expect(sandboxTree()).toBe('/explicit')
  })

  it('should give two independent processes two different trees', () => {
    const first = sandboxTree()
    delete process.env.AITK_SANDBOX_RUN_ID

    const second = sandboxTree()

    expect(first).not.toBe(second)
  })

  it('should give the same tree to two calls sharing one run id', () => {
    const first = sandboxTree()

    const second = sandboxTree()

    expect(second).toBe(first)
  })

  it('should give the same tree to a call that inherits an already-minted run id', () => {
    process.env.AITK_SANDBOX_RUN_ID = 'inherited-id'

    expect(sandboxTree()).toBe('/xdg/aitk/sandbox-inherited-id')
  })
})

describe('mintSandboxRunId', () => {
  it('should reuse an id a parent process already exported', () => {
    process.env.AITK_SANDBOX_RUN_ID = 'from-parent'

    expect(mintSandboxRunId()).toBe('from-parent')
  })

  it('should mint once and hold the same id across repeated calls', () => {
    const first = mintSandboxRunId()

    expect(mintSandboxRunId()).toBe(first)
    expect(process.env.AITK_SANDBOX_RUN_ID).toBe(first)
  })
})
