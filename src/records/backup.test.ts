import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { $ } from 'bun'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { gitEnv } from '@/git-env'
import { BACKED_FOLDERS, pullRecords, pushRecords } from '@/records/backup'

let ROOT: string
let ORIGIN: string

const RECORDS_GIT_DIR = join('.claude', '.records.git')

/**
 * `gitEnv()` is what keeps these fixtures off the repository under test. The
 * pre-push hook exports `GIT_DIR` and `GIT_WORK_TREE`, and both take precedence
 * over `-C` and `--git-dir`, so a bare call here resolves against this
 * repository and the suite fails only when run from a hook.
 */
async function git(args: string[]): Promise<string> {
  const result = await $`git ${args}`.env(gitEnv()).quiet().nothrow()
  return result.stdout.toString().trim()
}

function recordsGit(root: string, args: string[]): Promise<string> {
  return git(['--git-dir', join(root, RECORDS_GIT_DIR), ...args])
}

/**
 * A git project holding one record in each backed folder, with no records
 * history yet.
 *
 * The `git init` is what a real root always carries. Both verbs read the
 * project's own remotes to clear the shared-origin gate and refuse when that
 * read fails, so a bare directory exercises the refusal rather than the flow.
 */
async function makeProject(): Promise<string> {
  const root = mkdtempSync(join(tmpdir(), 'aitk-backup-'))
  for (const folder of BACKED_FOLDERS) {
    mkdirSync(join(root, '.claude', folder), { recursive: true })
    writeFileSync(join(root, '.claude', folder, 'entry.md'), `# ${folder}\n`)
  }
  await git(['init', '--quiet', root])
  return root
}

/** Every path the records origin holds on its branch, newline-joined. */
function trackedOnOrigin(): Promise<string> {
  return git(['-C', ORIGIN, 'ls-tree', '-r', '--name-only', 'main'])
}

async function makeRecordsRepo(root: string, origin: string): Promise<void> {
  await recordsGit(root, ['init'])
  await recordsGit(root, ['remote', 'add', 'origin', origin])
}

beforeEach(async () => {
  ROOT = await makeProject()
  ORIGIN = mkdtempSync(join(tmpdir(), 'aitk-backup-origin-'))
  await git(['init', '--bare', ORIGIN])
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
  rmSync(ORIGIN, { recursive: true, force: true })
})

describe('BACKED_FOLDERS', () => {
  // One line per record surface is what the list is for, and an archive named
  // beside the folder it archives is what used to cost a second. Both halves
  // are asserted because either alone passes on the other's failure: a nested
  // path satisfies the suffix test, and a sibling named `archive` satisfies
  // the segment test.
  it('should name only top-level record folders', () => {
    expect(BACKED_FOLDERS.filter((folder) => folder.includes('/'))).toEqual([])
  })

  it('should carry no archive as a sibling of what it archives', () => {
    expect(
      BACKED_FOLDERS.filter((folder) => folder.endsWith('-archive')),
    ).toEqual([])
  })

  // Every other assertion in this file reads the list rather than pinning it,
  // so a name arriving or leaving passes them all. The payload is what a disk
  // loss would take on one side and what a backup ships to a private remote on
  // the other, so both directions are worth failing on: a name added by
  // accident enlarges what leaves the machine, and a name dropped by accident
  // strands a folder nothing else copies.
  it('should name exactly the record folders a backup carries', () => {
    expect([...BACKED_FOLDERS]).toEqual([
      'diagrams',
      'groundwork',
      'intake',
      'memory',
      'plans',
      'proposals',
      'review',
      'tasks',
      'teach',
    ])
  })
})

describe('pushRecords', () => {
  it('should name the setup command when no records history exists', async () => {
    const outcome = await pushRecords(ROOT)

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.reason).toBe('no-repository')
    expect(outcome.message).toContain('git --git-dir=')
  })

  it('should refuse when the records history has no origin', async () => {
    await recordsGit(ROOT, ['init'])

    const outcome = await pushRecords(ROOT)

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.reason).toBe('no-remote')
  })

  it('should refuse when the project remotes cannot be read', async () => {
    const bare = mkdtempSync(join(tmpdir(), 'aitk-backup-bare-'))
    mkdirSync(join(bare, '.claude'), { recursive: true })
    await makeRecordsRepo(bare, ORIGIN)

    const outcome = await pushRecords(bare)

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.reason).toBe('remote-unreadable')

    const pushed = await git(['-C', ORIGIN, 'branch', '--list'])
    expect(pushed).toBe('')

    rmSync(bare, { recursive: true, force: true })
  })

  it('should refuse when the records origin is also a remote of the project', async () => {
    await git(['-C', ROOT, 'remote', 'add', 'origin', `${ORIGIN}.git`])
    await makeRecordsRepo(ROOT, ORIGIN)

    const outcome = await pushRecords(ROOT)

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.reason).toBe('remote-shared')
  })

  it('should refuse a project remote spelled with the other transport', async () => {
    await git([
      '-C',
      ROOT,
      'remote',
      'add',
      'origin',
      'https://github.com/owner/repo.git',
    ])
    await recordsGit(ROOT, ['init'])
    await recordsGit(ROOT, [
      'remote',
      'add',
      'origin',
      'git@github.com:owner/repo.git',
    ])

    const outcome = await pushRecords(ROOT)

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.reason).toBe('remote-shared')
  })

  it('should carry a backed folder deleted in full since the last push', async () => {
    await makeRecordsRepo(ROOT, ORIGIN)
    await pushRecords(ROOT)
    rmSync(join(ROOT, '.claude', 'intake'), { recursive: true, force: true })

    const outcome = await pushRecords(ROOT)

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.changed).toBe(1)

    const tracked = await git([
      '-C',
      ORIGIN,
      'ls-tree',
      '-r',
      '--name-only',
      'main',
    ])
    expect(tracked).not.toContain('intake/')
  })

  // The archives moved inside the records they archive, which takes a name off
  // the backed list rather than off the disk. A pathspec built from that list
  // alone never mentions the old name again, so its deletion never stages, the
  // remote keeps it, and a pull restores it beside the folder that replaced it.
  it('should carry a folder that left the backed list since the last push', async () => {
    const retired = join(ROOT, '.claude', 'plans-archive')
    mkdirSync(retired, { recursive: true })
    writeFileSync(join(retired, 'entry.md'), '# retired\n')
    await makeRecordsRepo(ROOT, ORIGIN)
    await pushRecords(ROOT)

    // Asserted before the removal, because a name the pathspec never carries
    // reaches the remote on no push and passes the absence test below having
    // proved nothing.
    expect(await trackedOnOrigin()).toContain('plans-archive/entry.md')

    rmSync(retired, { recursive: true, force: true })
    const outcome = await pushRecords(ROOT)

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.changed).toBe(1)
    expect(await trackedOnOrigin()).not.toContain('plans-archive/')
  })

  it('should commit every backed folder and push it to the records origin', async () => {
    await makeRecordsRepo(ROOT, ORIGIN)

    const outcome = await pushRecords(ROOT)

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.changed).toBe(BACKED_FOLDERS.length)
    expect(outcome.pushed).toBe(true)

    const tracked = await git([
      '-C',
      ORIGIN,
      'ls-tree',
      '-r',
      '--name-only',
      'main',
    ])
    expect(tracked.split('\n').sort()).toEqual(
      BACKED_FOLDERS.map((folder) => `${folder}/entry.md`).sort(),
    )
  })

  it('should carry no path outside the backed folders', async () => {
    mkdirSync(join(ROOT, '.claude', 'skills'), { recursive: true })
    writeFileSync(join(ROOT, '.claude', 'skills', 'a.md'), 'shipped\n')
    writeFileSync(join(ROOT, '.claude', 'ARCHITECTURE.md'), 'shipped\n')
    mkdirSync(join(ROOT, '.claude', '.tmp'), { recursive: true })
    writeFileSync(join(ROOT, '.claude', '.tmp', 'scratch.md'), 'scratch\n')
    await makeRecordsRepo(ROOT, ORIGIN)

    await pushRecords(ROOT)

    const tracked = await git([
      '-C',
      ORIGIN,
      'ls-tree',
      '-r',
      '--name-only',
      'main',
    ])
    expect(tracked).not.toContain('skills/')
    expect(tracked).not.toContain('ARCHITECTURE.md')
    expect(tracked).not.toContain('.tmp/')
  })

  it('should commit nothing on a second push that changed no record', async () => {
    await makeRecordsRepo(ROOT, ORIGIN)
    await pushRecords(ROOT)

    const outcome = await pushRecords(ROOT)

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.changed).toBe(0)
    expect(outcome.pushed).toBe(true)

    const log = await recordsGit(ROOT, ['log', '--oneline'])
    expect(log.split('\n')).toHaveLength(1)
  })

  it('should carry a record deleted since the last push', async () => {
    await makeRecordsRepo(ROOT, ORIGIN)
    await pushRecords(ROOT)
    rmSync(join(ROOT, '.claude', 'memory', 'entry.md'))

    const outcome = await pushRecords(ROOT)

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.changed).toBe(1)

    const tracked = await git([
      '-C',
      ORIGIN,
      'ls-tree',
      '-r',
      '--name-only',
      'main',
    ])
    expect(tracked).not.toContain('memory/entry.md')
  })

  it('should leave the project working tree untouched', async () => {
    await makeRecordsRepo(ROOT, ORIGIN)

    await pushRecords(ROOT)

    const status = await git(['-C', ROOT, 'status', '--porcelain'])
    expect(status).toContain('.claude/')
    expect(await git(['-C', ROOT, 'log', '--oneline'])).toBe('')
  })
})

describe('pullRecords', () => {
  it('should refuse when the records origin carries no branch yet', async () => {
    await makeRecordsRepo(ROOT, ORIGIN)

    const outcome = await pullRecords(ROOT)

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.reason).toBe('no-remote-records')
  })

  it('should refuse rather than discard a local record that never reached the remote', async () => {
    await makeRecordsRepo(ROOT, ORIGIN)
    await pushRecords(ROOT)
    writeFileSync(
      join(ROOT, '.claude', 'memory', 'unpushed.md'),
      'local only\n',
    )

    const outcome = await pullRecords(ROOT)

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.reason).toBe('local-changes')
    expect(
      readFileSync(join(ROOT, '.claude', 'memory', 'unpushed.md'), 'utf8'),
    ).toBe('local only\n')
  })

  it('should refuse when a local commit has not reached the records origin', async () => {
    await makeRecordsRepo(ROOT, ORIGIN)
    await pushRecords(ROOT)
    writeFileSync(join(ROOT, '.claude', 'plans', 'later.md'), 'later\n')
    await recordsGit(ROOT, [
      '--work-tree',
      join(ROOT, '.claude'),
      'add',
      '-A',
      '-f',
      '--',
      'plans',
    ])
    await recordsGit(ROOT, [
      '--work-tree',
      join(ROOT, '.claude'),
      '-c',
      'user.name=t',
      '-c',
      'user.email=t@t',
      'commit',
      '--quiet',
      '-m',
      'local',
    ])

    const outcome = await pullRecords(ROOT)

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.reason).toBe('local-ahead')
  })

  it('should refuse when a backed folder was deleted in full without being pushed', async () => {
    await makeRecordsRepo(ROOT, ORIGIN)
    await pushRecords(ROOT)
    rmSync(join(ROOT, '.claude', 'intake'), { recursive: true, force: true })

    const outcome = await pullRecords(ROOT)

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.reason).toBe('local-changes')
  })

  it('should refuse when a record was deleted locally without being pushed', async () => {
    await makeRecordsRepo(ROOT, ORIGIN)
    await pushRecords(ROOT)
    rmSync(join(ROOT, '.claude', 'memory', 'entry.md'))

    const outcome = await pullRecords(ROOT)

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.reason).toBe('local-changes')
  })

  it('should write the records the remote carries onto a machine holding none', async () => {
    await makeRecordsRepo(ROOT, ORIGIN)
    await pushRecords(ROOT)

    const fresh = mkdtempSync(join(tmpdir(), 'aitk-backup-fresh-'))
    mkdirSync(join(fresh, '.claude'), { recursive: true })
    await git(['init', '--quiet', fresh])
    await makeRecordsRepo(fresh, ORIGIN)

    const outcome = await pullRecords(fresh)

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.files).toBe(BACKED_FOLDERS.length)
    expect(
      readFileSync(join(fresh, '.claude', 'memory', 'entry.md'), 'utf8'),
    ).toBe('# memory\n')

    rmSync(fresh, { recursive: true, force: true })
  })

  it('should refuse when no records history exists', async () => {
    const outcome = await pullRecords(ROOT)

    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.reason).toBe('no-repository')
  })
})
