import type { SkillCase } from '@/claude/skills-rank'

/**
 * Script, skill, snippet, standard, and doc authoring, plus the two prose
 * skills that revise rather than generate.
 */
export const AUTHORING_CASES: readonly SkillCase[] = [
  {
    prompt:
      'I need a shell tool with prompts and a nice terminal UI for people to run by hand.',
    expect: 'bash-script',
  },
  {
    prompt:
      'Wire up a GitHub Actions pipeline with parallel jobs for this repo.',
    expect: 'ci-workflow',
  },
  {
    prompt:
      'Write me a headless automation script with no interactive prompts.',
    expect: 'bash-cli-script',
  },
  {
    prompt: 'Scaffold a brand-new SKILL.md for this capability.',
    expect: 'create-skill',
  },
  {
    prompt: 'I need a new reusable prompt snippet added to the corpus.',
    expect: 'create-snippet',
  },
  {
    prompt: 'Write a fresh authoring convention as a new standard file.',
    expect: 'create-standard',
  },
  {
    prompt:
      "The docs folder and README are stale against what's on main, refresh them.",
    expect: 'docs-sync',
  },
  {
    prompt: 'Say what that dense answer actually means in plain terms.',
    expect: 'restate-plainly',
  },
  {
    prompt: 'This passage reads flat and robotic, give it some real cadence.',
    expect: 'write-human',
  },
  {
    prompt:
      'Pull the captions off this YouTube link and save them with metadata.',
    expect: 'youtube-transcripts',
  },
]
