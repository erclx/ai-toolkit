import type { SkillCase } from '@/claude/skills-rank'

/** Skills that share no prefix with any other domain file here. */
export const MISC_CASES: readonly SkillCase[] = [
  {
    prompt:
      'Bundle up every open call that only I can make and ask me all at once.',
    expect: 'decision-escalate',
  },
  {
    prompt: 'Fire up the dev server the way this project documents it.',
    expect: 'project-commands',
  },
  {
    prompt:
      "We're about to hit the context limit, write the handoff before we lose state.",
    expect: 'session-map',
  },
  {
    prompt: 'Catch me up on what was in progress before this session started.',
    expect: 'session-resume',
  },
  {
    prompt: "This test just started failing and I don't know why yet.",
    expect: 'systematic-debugging',
  },
  {
    prompt: 'Does our github about text still match what the readme says?',
    expect: 'repo-metadata',
  },
]
