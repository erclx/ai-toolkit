export interface CreateIssueOptions {
  title: string
  body: string
  labels?: string[]
}

export function buildIssueArgs(opts: CreateIssueOptions): string[] {
  const args = ['issue', 'create', '--title', opts.title, '--body', opts.body]
  for (const label of opts.labels ?? []) {
    args.push('--label', label)
  }
  return args
}
