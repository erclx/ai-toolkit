import type { SkillCase } from '@/claude/skills-rank'

/**
 * `setup-*`, `migration-*`, `toolkit-*`, and `create-rule`: scaffolding,
 * proposal-only migrations, and the toolkit's own reference and feedback
 * surfaces.
 */
export const SETUP_CASES: readonly SkillCase[] = [
  {
    prompt:
      'This project has no rules installed yet, get the right governance in place.',
    expect: 'setup-gov',
  },
  {
    prompt:
      "Get the index.md system bootstrapped across this project's folders.",
    expect: 'setup-indexes',
  },
  {
    prompt:
      'This is a brand-new project, get the toolkit bootstrapped in one shot.',
    expect: 'setup-init',
  },
  {
    prompt: 'Get the usual Claude Code plugins provisioned on this machine.',
    expect: 'setup-plugins',
  },
  {
    prompt:
      "Run through the generated scaffold's scripts and confirm each one passes.",
    expect: 'setup-verify',
  },
  {
    prompt:
      'This CLAUDE.md file has grown huge, break it apart into the tiered context model.',
    expect: 'migration-claude-md',
  },
  {
    prompt:
      'Move the agent-flavored docs out of the docs folder and into context.',
    expect: 'migration-context',
  },
  {
    prompt:
      'This file was replaced by a folder, help me split its content into it.',
    expect: 'migration-superseded',
  },
  {
    prompt:
      "Before I run this sync, tell me exactly what it's going to overwrite.",
    expect: 'toolkit-cli',
  },
  {
    prompt:
      'Something about the toolkit itself is broken, write it up and send it back to the maintainers.',
    expect: 'toolkit-feedback',
  },
  {
    prompt:
      "I don't know which specific toolkit skill I need, just handle it for me.",
    expect: 'toolkit-operator',
  },
  {
    prompt:
      'Work through the open feedback issues on the toolkit repo one by one.',
    expect: 'toolkit-triage',
  },
  {
    prompt:
      "This project needs its own coding rule that the toolkit doesn't ship.",
    expect: 'create-rule',
  },
]
