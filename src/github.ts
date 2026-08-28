import { execa } from 'execa'
import { gitEnv } from '@/git-env'
import { PROJECT_ROOT } from '@/project-root'
import { buildIssueArgs, type CreateIssueOptions } from '@/github-format'

const GH_TIMEOUT_MS = 30_000

export async function createGithubIssue(
  opts: CreateIssueOptions,
): Promise<string | null> {
  if (Bun.which('gh') === null) return null
  try {
    // See src/worktrees/reclaim.ts for why gh needs the stripped environment.
    const result = await execa('gh', buildIssueArgs(opts), {
      cwd: PROJECT_ROOT,
      timeout: GH_TIMEOUT_MS,
      env: gitEnv(),
      extendEnv: false,
    })
    return result.stdout.trim() || null
  } catch {
    return null
  }
}
