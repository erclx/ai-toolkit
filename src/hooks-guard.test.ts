import { spawn } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'vitest'

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
// exit 0. That is the path under Claude Code, which the guard must leave alone.
const INERT_PAYLOAD = JSON.stringify({
  session_id: 'hooks-guard-test',
  tool_input: { file_path: '/nowhere/ignored.txt' },
  tool_name: 'Read',
})

interface Run {
  readonly code: number | null
  readonly elapsed: number
  readonly stderr: string
}

// Omitting the payload leaves stdin open with nothing written and no EOF, which
// is the descriptor the hang came from. Closing it instead would exercise the
// cheap case and leave the observed one untested.
const run = (hook: string, payload?: string): Promise<Run> =>
  new Promise((resolve) => {
    const started = performance.now()
    const child = spawn('bash', [hook], { stdio: ['pipe', 'ignore', 'pipe'] })
    let stderr = ''

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('close', (code) => {
      resolve({ code, elapsed: performance.now() - started, stderr })
    })

    if (payload !== undefined) child.stdin.end(payload)
  })

for (const tree of TREES) {
  const hooks = readdirSync(tree.dir).filter((name) => name !== UNGUARDED)

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
          expect(result.code).toBe(0)
        },
      )
    }
  })
}
