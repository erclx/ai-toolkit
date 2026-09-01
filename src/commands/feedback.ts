import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Command } from 'commander'
import {
  deriveSlug,
  deriveTitle,
  missingField,
  missingFieldMessage,
} from '@/commands/feedback-format'
import { PROJECT_ROOT } from '@/project-root'
import { creationRel } from '@/record-root'
import { createGithubIssue } from '@/github'
import { issueFailureMessage } from '@/github-format'
import { frameError, frameSuccess, palette } from '@/ui'

function readStdin(): Promise<string> {
  return new Promise((resolveStream, rejectStream) => {
    const chunks: Buffer[] = []
    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk))
    process.stdin.on('end', () =>
      resolveStream(Buffer.concat(chunks).toString('utf8')),
    )
    process.stdin.on('error', rejectStream)
  })
}

function timestamp(): string {
  const d = new Date()
  const pad = (n: number): string => n.toString().padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

/**
 * A registry install ships no `.claude/`, so a local write would land inside
 * `node_modules/` and report a project-relative path the operator cannot find.
 * The toolkit source is the only root where local scratch reaches a maintainer.
 */
function isToolkitSource(): boolean {
  return existsSync(join(PROJECT_ROOT, '.claude'))
}

/**
 * One producer, one subfolder. The review folder carries the output of four
 * unrelated producers, and the filename prefix was doing the folder's job by
 * hand, so each writes under its own name and the enclosing folder keeps the
 * single ignore entry and the single backed-folder entry it already had.
 */
function writeLocal(body: string): string {
  // Resolved against the same root the write joins onto, so a checkout that has
  // not migrated its records writes this beside the ones already there rather
  // than opening a second root nothing reads.
  const relativeDir = creationRel(PROJECT_ROOT, 'review', 'feedback')
  const reviewDir = join(PROJECT_ROOT, relativeDir)
  mkdirSync(reviewDir, { recursive: true })
  const filename = `feedback-${deriveSlug(body)}-${timestamp()}.md`
  const filePath = join(reviewDir, filename)
  writeFileSync(filePath, `${body}\n`, 'utf8')
  frameSuccess('canon feedback', join(relativeDir, filename))
  return filePath
}

export function register(program: Command): void {
  program
    .command('feedback')
    .description(
      'Write toolkit feedback from stdin to .canon/review/feedback/, or open a GitHub issue with --github',
    )
    .option(
      '--github',
      'Open a GitHub issue on the toolkit repo instead of writing local scratch',
    )
    .action(async (opts: { github?: boolean }) => {
      if (process.stdin.isTTY) {
        frameError(
          'No feedback on stdin. Pipe a markdown block: pbpaste | canon feedback',
        )
        process.exitCode = 1
        return
      }
      const body = (await readStdin()).trim()
      if (!body) {
        frameError('Empty feedback body. Provide a markdown block on stdin.')
        process.exitCode = 1
        return
      }

      // Both write paths, not `--github` alone. A report missing its surface is
      // no more useful sitting in the triage queue on disk than in the tracker.
      const absent = missingField(body)
      if (absent) {
        frameError(missingFieldMessage(absent))
        process.exitCode = 1
        return
      }

      if (opts.github) {
        const result = await createGithubIssue({
          title: deriveTitle(body),
          body,
          labels: ['feedback'],
        })
        if (result.ok) {
          frameSuccess('canon feedback', result.url)
          process.stdout.write(`${result.url}\n`)
          return
        }
        const reason = issueFailureMessage(result)
        if (!isToolkitSource()) {
          frameError(`${reason} No toolkit source to fall back to.`)
          process.exitCode = 1
          return
        }
        const { NC, YELLOW } = palette(process.stderr)
        process.stderr.write(
          `${YELLOW}! ${reason} Wrote local scratch instead.${NC}\n`,
        )
      }

      if (!isToolkitSource()) {
        frameError(
          'Local scratch needs the toolkit source. Re-run with --github to open an issue instead.',
        )
        process.exitCode = 1
        return
      }

      const filePath = writeLocal(body)
      process.stdout.write(`${filePath}\n`)
    })
}
