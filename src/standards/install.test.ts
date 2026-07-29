import { chmod, mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { applyInstall, planInstall } from '@/standards/install'

const dirs: string[] = []

async function makeDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'aitk-standards-install-'))
  dirs.push(dir)
  return dir
}

async function makeSource(names: readonly string[]): Promise<string> {
  const dir = await makeDir()
  await Promise.all(
    names.map((name) => writeFile(join(dir, name), `# ${name}\n`)),
  )
  return dir
}

afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  )
})

describe('planInstall', () => {
  it('should list every flat markdown standard', async () => {
    const source = await makeSource(['prose.md', 'skill.md'])

    expect(planInstall(source).map((file) => file.name)).toEqual([
      'prose.md',
      'skill.md',
    ])
  })

  it('should exclude index.md, which install rebuilds separately', async () => {
    const source = await makeSource(['index.md', 'prose.md'])

    expect(planInstall(source).map((file) => file.name)).toEqual(['prose.md'])
  })

  it('should ignore a source subfolder so install matches what sync scans', async () => {
    const source = await makeSource(['prose.md'])
    await mkdir(join(source, 'bundled'), { recursive: true })
    await writeFile(join(source, 'bundled', 'extra.md'), '# extra\n')

    expect(planInstall(source).map((file) => file.name)).toEqual(['prose.md'])
  })

  it('should ignore a non-markdown file', async () => {
    const source = await makeSource(['prose.md'])
    await writeFile(join(source, 'notes.txt'), 'text\n')

    expect(planInstall(source).map((file) => file.name)).toEqual(['prose.md'])
  })

  it('should sort the standards by name', async () => {
    const source = await makeSource(['skill.md', 'branch.md', 'prose.md'])

    expect(planInstall(source).map((file) => file.name)).toEqual([
      'branch.md',
      'prose.md',
      'skill.md',
    ])
  })

  it('should return nothing when the source directory is absent', async () => {
    const dir = await makeDir()

    expect(planInstall(join(dir, 'missing'))).toEqual([])
  })
})

describe('applyInstall', () => {
  it('should copy every standard into the destination', async () => {
    const source = await makeSource(['prose.md', 'skill.md'])
    const dest = join(await makeDir(), '.claude', 'standards')

    await applyInstall(planInstall(source), dest)

    expect(await Bun.file(join(dest, 'prose.md')).text()).toBe('# prose.md\n')
    expect(await Bun.file(join(dest, 'skill.md')).text()).toBe('# skill.md\n')
  })

  it('should return the labels relative to the target', async () => {
    const source = await makeSource(['prose.md'])
    const dest = join(await makeDir(), '.claude', 'standards')

    expect(await applyInstall(planInstall(source), dest)).toEqual([
      join('.claude', 'standards', 'prose.md'),
    ])
  })

  it('should leave an existing destination mode alone', async () => {
    const source = await makeSource(['prose.md'])
    const dest = join(await makeDir(), '.claude', 'standards')
    await mkdir(dest, { recursive: true })
    await writeFile(join(dest, 'prose.md'), 'old\n')
    await chmod(join(dest, 'prose.md'), 0o600)

    await applyInstall(planInstall(source), dest)

    const info = await stat(join(dest, 'prose.md'))
    expect(info.mode & 0o777).toBe(0o600)
  })

  it('should create the destination directory when it is missing', async () => {
    const source = await makeSource(['prose.md'])
    const dest = join(await makeDir(), 'nested', '.claude', 'standards')

    await applyInstall(planInstall(source), dest)

    expect(await Bun.file(join(dest, 'prose.md')).exists()).toBe(true)
  })
})
