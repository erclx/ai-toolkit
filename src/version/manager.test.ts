import { describe, expect, it } from 'vitest'
import { detectManager, installCommand } from '@/version/manager'

describe('detectManager', () => {
  it('should read bun off its global install tree', () => {
    const manager = detectManager(
      '/home/u/.bun/install/global/node_modules/@erclx/canon',
    )

    expect(manager?.id).toBe('bun')
  })

  it('should read pnpm off its global install tree', () => {
    const manager = detectManager(
      '/home/u/.local/share/pnpm/global/5/node_modules/@erclx/canon',
    )

    expect(manager?.id).toBe('pnpm')
  })

  it('should read yarn off its global install tree', () => {
    const manager = detectManager(
      '/home/u/.config/yarn/global/node_modules/@erclx/canon',
    )

    expect(manager?.id).toBe('yarn')
  })

  it('should fall back to npm for a plain node_modules path', () => {
    const manager = detectManager('/usr/local/lib/node_modules/@erclx/canon')

    expect(manager?.id).toBe('npm')
  })

  it('should read a windows path, where the separator differs', () => {
    const manager = detectManager(
      'C:\\Users\\u\\AppData\\Roaming\\npm\\node_modules\\@erclx\\canon',
    )

    expect(manager?.id).toBe('npm')
  })

  it('should detect nothing for a source checkout', () => {
    expect(detectManager('/home/u/repos/ai/canon')).toBeUndefined()
  })

  it('should carry the segment it matched so a wrong read is correctable', () => {
    const manager = detectManager(
      '/home/u/.bun/install/global/node_modules/@erclx/canon',
    )

    expect(manager?.evidence).toBe('.bun')
  })
})

describe('installCommand', () => {
  it('should pin the newest published version rather than any version', () => {
    expect(installCommand('npm', '@erclx/canon')).toContain(
      '@erclx/canon@latest',
    )
  })

  it('should spell yarn its own way, which takes no --global flag', () => {
    expect(installCommand('yarn', 'pkg')).toEqual([
      'yarn',
      'global',
      'add',
      'pkg@latest',
    ])
  })
})
