import { describe, expect, it } from 'vitest'
import { STAGES } from '@/gate/stages'

function scopeOf(id: string): RegExp {
  const stage = STAGES.find((candidate) => candidate.id === id)
  if (stage?.scope === undefined) throw new Error(`no scope on stage ${id}`)
  return stage.scope
}

describe('the shell stage scope', () => {
  it('should fire on a husky hook, which carries no extension to match', () => {
    const scope = scopeOf('shell')

    expect(scope.test('.husky/post-merge')).toBe(true)
    expect(scope.test('.husky/pre-push')).toBe(true)
  })

  it('should still fire on a script named .sh and on the manifest', () => {
    const scope = scopeOf('shell')

    expect(scope.test('scripts/core/regen-claude-copies.sh')).toBe(true)
    expect(scope.test('package.json')).toBe(true)
  })

  it('should not fire on a path that only mentions husky', () => {
    const scope = scopeOf('shell')

    expect(scope.test('docs/agents/husky.md')).toBe(false)
    expect(scope.test('src/husky/run.ts')).toBe(false)
  })
})
