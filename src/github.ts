import { execa } from 'execa'
import { PROJECT_ROOT } from '@/exec'
import { buildIssueArgs, type CreateIssueOptions } from '@/github-format'

const GH_TIMEOUT_MS = 30_000

export async function createGithubIssue(
  opts: CreateIssueOptions,
): Promise<string | null> {
  if (Bun.which('gh') === null) return null
  try {
    const result = await execa('gh', buildIssueArgs(opts), {
      cwd: PROJECT_ROOT,
      timeout: GH_TIMEOUT_MS,
    })
    return result.stdout.trim() || null
  } catch {
    return null
  }
}
