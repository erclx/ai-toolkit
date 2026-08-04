import { spawn } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { afterAll, beforeAll, describe, it } from 'vitest'

const ROOT = join(import.meta.dirname, '..')

// Both trees carry the same guard and nothing else compares them, so a fix
// landing in one and not the other passes every other stage in the gate.
const TREES = [
  { dir: join(ROOT, '.claude/hooks'), label: '.claude/hooks' },
  {
    dir: join(ROOT, 'tooling/claude/seeds/.claude/hooks'),
    label: 'tooling/claude/seeds/.claude/hooks',
  },
]

// The one hook that reads no payload, and so carries no guard to assert on.
const UNGUARDED = 'bare-flag-repair.sh'

// A tool name no hook acts on, so every guarded hook falls through to a quiet
// exit 0. This covers the tool filter and nothing else: a mangled payload
// reaches the same fall-through, which is why every hook also carries an
// acting case below.
const INERT_PAYLOAD = JSON.stringify({
  session_id: 'hooks-guard-inert',
  tool_input: { file_path: '/nowhere/ignored.txt' },
  tool_name: 'Read',
})

// The payload takes a nonce because three hooks dedupe on `session_id`, writing
// a marker under the project dir and staying silent for the rest of that
// session. Both trees run the same hook against one fixture, so a shared id
// silences whichever loses the race.
interface ActingCase {
  readonly expect: string
  readonly payload: (nonce: string) => string
}

interface Run {
  readonly code: number | null
  readonly elapsed: number
  readonly stderr: string
  readonly stdout: string
}

let fixture: string
let hookPath: string
let acting: Record<string, ActingCase>

// `aitk indexes regen` succeeds on the index hooks where the CLI is installed
// and is absent on a CI runner, so the acting output would differ by machine.
// Removing it from PATH pins both to the branch that reports a stale index,
// which fires only after the payload parsed and the path guard matched.
const pathWithoutAitk = (): string =>
  (process.env.PATH ?? '')
    .split(delimiter)
    .filter((dir) => dir !== '' && !existsSync(join(dir, 'aitk')))
    .join(delimiter)

// Omitting the payload leaves stdin open with nothing written and no EOF, which
// is the descriptor the hang came from. Closing it instead would exercise the
// cheap case and leave the observed one untested.
const run = (hook: string, payload?: string): Promise<Run> =>
  new Promise((resolve) => {
    const started = performance.now()
    const child = spawn('bash', [hook], {
      env: {
        ...process.env,
        CLAUDE_PROJECT_DIR: join(fixture, 'project'),
        PATH: hookPath,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('close', (code) => {
      resolve({ code, elapsed: performance.now() - started, stderr, stdout })
    })

    if (payload !== undefined) child.stdin.end(payload)
  })

const payloadFor = (fields: Record<string, unknown>): string =>
  JSON.stringify(fields)

beforeAll(() => {
  fixture = mkdtempSync(join(tmpdir(), 'hooks-guard-'))
  hookPath = pathWithoutAitk()

  const project = join(fixture, 'project')
  for (const dir of [
    join(project, '.claude/context'),
    join(project, '.claude/memory'),
    join(project, '.claude/tasks'),
    join(project, 'indexed'),
    join(fixture, 'elsewhere/tmp'),
  ]) {
    mkdirSync(dir, { recursive: true })
  }

  writeFileSync(
    join(project, 'doc.md'),
    '# Doc\n\nA line with an em dash — in it.\n',
  )
  writeFileSync(join(project, 'indexed/index.md'), '# Index\n')
  writeFileSync(
    join(project, '.claude/context/development.md'),
    'Dev commands.\n',
  )
  writeFileSync(join(project, '.claude/tasks/sample.md'), 'no frontmatter\n')
  writeFileSync(join(project, '.claude/memory/sample.md'), 'no frontmatter\n')

  // One payload per hook that reaches the branch doing the work, paired with a
  // string only that branch emits. A payload the read mangled produces the
  // quiet fall-through instead, so these are what make the guard's fidelity
  // observable rather than assumed.
  acting = {
    'dev-command-reminder.sh': {
      expect: 'Dev commands have gotchas',
      payload: (nonce) =>
        payloadFor({
          session_id: nonce,
          tool_input: { command: 'bun run check' },
          tool_name: 'Bash',
        }),
    },
    'index-reminder.sh': {
      expect: join(project, 'indexed/index.md'),
      payload: (nonce) =>
        payloadFor({
          session_id: nonce,
          tool_input: { path: join(project, 'indexed') },
          tool_name: 'Grep',
        }),
    },
    'memory-index.sh': {
      expect: '.claude/memory/index.md',
      payload: () =>
        payloadFor({
          tool_input: { file_path: join(project, '.claude/memory/sample.md') },
          tool_name: 'Write',
        }),
    },
    'scratch-guard.sh': {
      expect: 'Temporary file write outside',
      payload: (nonce) =>
        payloadFor({
          session_id: nonce,
          tool_input: { file_path: join(fixture, 'elsewhere/tmp/foo.txt') },
          tool_name: 'Write',
        }),
    },
    'standards-audit.sh': {
      expect: join(project, 'doc.md'),
      payload: () =>
        payloadFor({
          tool_input: { file_path: join(project, 'doc.md') },
          tool_name: 'Write',
        }),
    },
    'tasks-index.sh': {
      expect: '.claude/tasks/index.md',
      payload: () =>
        payloadFor({
          tool_input: { file_path: join(project, '.claude/tasks/sample.md') },
          tool_name: 'Write',
        }),
    },
  }
})

afterAll(() => {
  rmSync(fixture, { force: true, recursive: true })
})

for (const tree of TREES) {
  const hooks = readdirSync(tree.dir).filter(
    (name) => name.endsWith('.sh') && name !== UNGUARDED,
  )

  describe(tree.label, () => {
    // Concurrent because every refusal test spends the guard's two seconds
    // waiting, and eleven of them in series would dominate the suite.
    for (const name of hooks) {
      const hook = join(tree.dir, name)

      it.concurrent(
        `should refuse ${name} with a usage line when no payload arrives`,
        async ({ expect }) => {
          const result = await run(hook)

          expect(result.code).not.toBe(0)
          expect(result.stderr).toContain('cannot be run by hand')
          expect(result.elapsed).toBeLessThan(3000)
        },
      )

      it.concurrent(
        `should leave ${name} silent on a payload it ignores`,
        async ({ expect }) => {
          const result = await run(hook, INERT_PAYLOAD)

          expect(result.stderr).toBe('')
          expect(result.stdout).toBe('')
          expect(result.code).toBe(0)
        },
      )

      // A hook added without an acting case fails here rather than passing on
      // the refusal test alone, which is what keeps the directory walk honest.
      it.concurrent(
        `should carry ${name} through to its verdict on an acting payload`,
        async ({ expect }) => {
          const expected = acting[name]
          expect(expected, `no acting case defined for ${name}`).toBeDefined()

          const result = await run(
            hook,
            expected.payload(`${tree.label}-${name}`),
          )

          expect(result.stdout).toContain(expected.expect)
          expect(result.code).toBe(0)
        },
      )
    }
  })
}
