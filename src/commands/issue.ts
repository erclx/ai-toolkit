import type { Command } from 'commander'
import { createGithubIssue } from '@/github'
import { frameError, frameSuccess } from '@/ui'

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

function collectLabel(value: string, previous: string[]): string[] {
  return [...previous, value]
}

export function register(program: Command): void {
  const issue = program
    .command('issue')
    .description('GitHub issue commands for the toolkit repo (create)')

  issue
    .command('create')
    .description('Open a GitHub issue from a title and a stdin body')
    .requiredOption('--title <title>', 'Issue title')
    .option('--label <label>', 'Label to apply, repeatable', collectLabel, [])
    .action(async (opts: { title: string; label: string[] }) => {
      if (process.stdin.isTTY) {
        frameError(
          'No issue body on stdin. Pipe a markdown block: cat body.md | aitk issue create --title "..."',
        )
        process.exit(1)
      }
      const body = (await readStdin()).trim()
      if (!body) {
        frameError('Empty issue body. Provide a markdown block on stdin.')
        process.exit(1)
      }

      const url = await createGithubIssue({
        title: opts.title,
        body,
        labels: opts.label,
      })
      if (!url) {
        frameError(
          'gh unavailable or issue creation failed. Install and authenticate gh.',
        )
        process.exit(1)
      }

      frameSuccess('aitk issue', url)
      process.stdout.write(`${url}\n`)
    })
}
