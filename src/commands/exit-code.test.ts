import { existsSync } from 'node:fs'
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { execa } from 'execa'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const REPO_ROOT = join(import.meta.dirname, '..', '..')
const CLI = join(REPO_ROOT, 'src', 'cli.ts')

/**
 * A linked worktree carries an empty `node_modules`, so the packages resolve
 * from an ancestor. The relocated copy sits under the temp directory and
 * reaches neither, which is why it needs the populated one named outright.
 */
function findInstalledModules(): string {
  let dir = REPO_ROOT
  while (!existsSync(join(dir, 'node_modules', 'commander'))) {
    const parent = dirname(dir)
    if (parent === dir) throw new Error('No node_modules holding commander')
    dir = parent
  }
  return join(dir, 'node_modules')
}
const SETUP_TIMEOUT_MS = 60_000
const RUN_TIMEOUT_MS = 30_000

interface CliResult {
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
}

interface RunOptions {
  readonly cwd: string
  readonly cli?: string
  readonly input?: string
  readonly emptyPath?: string
}

/**
 * Spawns the CLI as a process rather than importing it, because the exit code
 * is the assertion and an in-process action would set it on the test runner.
 * `process.execPath` is the Bun binary under `bun --bun vitest`, and naming it
 * absolutely is what lets a case blank `PATH` to hide `gh` or `yt-dlp`.
 */
async function runCli(args: string[], opts: RunOptions): Promise<CliResult> {
  const result = await execa(process.execPath, [opts.cli ?? CLI, ...args], {
    cwd: opts.cwd,
    input: opts.input ?? '',
    reject: false,
    timeout: RUN_TIMEOUT_MS,
    env: opts.emptyPath ? { PATH: opts.emptyPath } : {},
  })
  return {
    exitCode: result.exitCode ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

describe('command action exit codes', () => {
  let workDir: string
  let emptyPath: string
  let relocatedCli: string

  /**
   * `isToolkitSource` reads `.claude/` under `PROJECT_ROOT`, which resolves
   * from the CLI's own location rather than the working directory. Reaching
   * the two branches that guard against writing scratch into an installed
   * package therefore needs the CLI itself to sit outside the toolkit tree.
   */
  beforeAll(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'aitk-exit-code-'))
    emptyPath = join(workDir, 'empty-path')
    await mkdir(emptyPath)

    const relocatedRoot = join(workDir, 'relocated')
    await cp(join(REPO_ROOT, 'src'), join(relocatedRoot, 'src'), {
      recursive: true,
    })
    await cp(
      join(REPO_ROOT, 'tsconfig.json'),
      join(relocatedRoot, 'tsconfig.json'),
    )
    await symlink(findInstalledModules(), join(relocatedRoot, 'node_modules'))
    relocatedCli = join(relocatedRoot, 'src', 'cli.ts')
  }, SETUP_TIMEOUT_MS)

  afterAll(async () => {
    await rm(workDir, { recursive: true, force: true })
  })

  /**
   * The deck filename follows the source basename, so each case gets its own
   * directory holding a `SLIDES.md` rather than a distinguishing filename the
   * assertion would then have to reproduce.
   */
  async function writeDeckSource(name: string): Promise<string> {
    const dir = join(workDir, `${name}-source`)
    await mkdir(dir)
    const source = join(dir, 'SLIDES.md')
    await writeFile(source, '# Deck\n\n## Slide one\n\nBody text.\n', 'utf8')
    return source
  }

  it('should exit 1 when design render cannot find its source', async () => {
    const result = await runCli(
      ['design', 'render', '--source', 'absent-design.md'],
      { cwd: workDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('absent-design.md not found')
  })

  it('should exit 1 when slides render cannot find its source', async () => {
    const result = await runCli(
      ['slides', 'render', '--source', 'absent-slides.md'],
      { cwd: workDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('absent-slides.md not found')
  })

  it('should exit 1 when slides render is given an unknown variant', async () => {
    const source = join(workDir, 'variant-source.md')
    await writeFile(source, '# Deck\n', 'utf8')

    const result = await runCli(
      ['slides', 'render', '--source', source, '--variant', 'sideways'],
      { cwd: workDir },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('Invalid variant "sideways"')
  })

  it('should exit 1 when feedback receives an empty body on stdin', async () => {
    const result = await runCli(['feedback'], { cwd: workDir, input: '   \n' })

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('Empty feedback body')
  })

  it('should exit 1 when feedback has no toolkit source to write into', async () => {
    const result = await runCli(['feedback'], {
      cwd: workDir,
      cli: relocatedCli,
      input: '# Report\n\nSomething broke.\n',
    })

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('Local scratch needs the toolkit source')
  })

  it('should exit 1 when feedback --github finds neither gh nor a toolkit source', async () => {
    const result = await runCli(['feedback', '--github'], {
      cwd: workDir,
      cli: relocatedCli,
      input: '# Report\n\nSomething broke.\n',
      emptyPath,
    })

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('gh unavailable')
  })

  /**
   * The only converted site behind a `process.stdin.isTTY` test, so a pipe
   * cannot reach it. `script` allocates a pty and `-e` forwards the child's
   * status, both util-linux spellings that macOS does not share. The guard
   * reads the binary rather than the platform, since a minimal Linux image
   * ships without it and an absent command reports as a failure, not a skip.
   */
  it.skipIf(process.platform !== 'linux' || Bun.which('script') === null)(
    'should exit 1 when feedback is run with a terminal on stdin',
    async () => {
      const result = await execa(
        'script',
        ['-qec', `'${process.execPath}' '${CLI}' feedback`, '/dev/null'],
        { cwd: workDir, input: '', reject: false, timeout: RUN_TIMEOUT_MS },
      )

      expect(result.exitCode).toBe(1)
      expect(result.stdout).toContain('No feedback on stdin')
    },
  )

  it('should exit 1 when transcripts cannot find yt-dlp', async () => {
    const result = await runCli(
      ['transcripts', 'https://youtu.be/dQw4w9WgXcQ'],
      { cwd: workDir, emptyPath },
    )

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('yt-dlp not found on PATH')
  })

  it('should exit 0 when slides render writes a deck', async () => {
    const source = await writeDeckSource('plain')

    const result = await runCli(
      ['slides', 'render', '--source', source, '--out', join(workDir, 'deck')],
      { cwd: workDir },
    )

    expect(result.exitCode).toBe(0)
    expect(existsSync(join(workDir, 'deck', 'SLIDES.pptx'))).toBe(true)
  })

  it('should exit 0 when slides render is given a known variant', async () => {
    const source = await writeDeckSource('dark')

    const result = await runCli(
      [
        'slides',
        'render',
        '--source',
        source,
        '--out',
        join(workDir, 'dark-deck'),
        '--variant',
        'dark',
      ],
      { cwd: workDir },
    )

    expect(result.exitCode).toBe(0)
    expect(existsSync(join(workDir, 'dark-deck', 'SLIDES.pptx'))).toBe(true)
  })
})
