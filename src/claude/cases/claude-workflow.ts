import type { SkillCase } from '@/claude/skills-rank'

/**
 * The `claude-*` skill family: feature planning, review, and the session
 * artifacts that coordinate work across sessions.
 *
 * Every positive is phrased away from its skill's own quoted trigger, since a
 * verbatim trigger passes by construction and proves nothing about a prompt in
 * someone's own words. Negatives target the pairs whose bodies already state
 * an explicit `Do NOT` boundary against each other, since a boundary in a
 * body does not reach the field a router reads.
 */
export const CLAUDE_WORKFLOW_CASES: readonly SkillCase[] = [
  {
    prompt: 'Go fix everything the reviewer flagged on my open PR.',
    expect: 'claude-address-review',
  },
  {
    prompt:
      'Run the whole implement, verify, review, and ship pipeline for the approved plan.',
    expect: 'claude-autoship',
  },
  {
    prompt: "Pull together a design system from what's already in the app.",
    expect: 'claude-design-extract',
  },
  {
    prompt: 'Draw me a diagram of how the pieces of this system connect.',
    expect: 'claude-diagram',
  },
  {
    prompt:
      'Bring the internal planning docs under .claude up to date with what we decided this session.',
    expect: 'claude-docs',
  },
  {
    prompt:
      'Sketch out a plan for adding this new capability before we touch any code.',
    expect: 'claude-feature',
  },
  {
    prompt:
      'We need to measure this properly before committing to an approach.',
    expect: 'claude-groundwork',
  },
  {
    prompt: 'Take this pile of raw notes and turn it into filed items.',
    expect: 'claude-intake',
  },
  {
    prompt: 'Walk me through the open intake items so I can decide on each.',
    expect: 'claude-intake-answer',
  },
  {
    prompt:
      "Draft a diff-based proposal for tightening this passage in the standard, don't just edit it.",
    expect: 'claude-markdown-propose',
  },
  {
    prompt: 'Pull the durable lessons out of this session before it ends.',
    expect: 'claude-memory-capture',
  },
  {
    prompt:
      'Go through the memory folder and propose what to do with each entry.',
    expect: 'claude-memory-review',
  },
  {
    prompt:
      'Take on the orchestrator role and coordinate the parallel feature builds.',
    expect: 'claude-orchestrate',
  },
  {
    prompt: 'Post a formal review with findings on that open pull request.',
    expect: 'claude-pr-review',
  },
  {
    prompt:
      'Look over everything that changed on this branch for bugs and edge cases.',
    expect: 'claude-review',
  },
  {
    prompt: 'Draft me a script with beats for a screencast recording.',
    expect: 'canon-screencast',
  },
  {
    prompt:
      "Check whether my installed Claude seed docs have drifted from the toolkit's.",
    expect: 'claude-seed-sync',
  },
  {
    prompt: 'Turn this topic into a slide deck I can render.',
    expect: 'canon-slides-draft',
  },
  {
    prompt:
      'Check whether the markdown I changed violates any authoring standards.',
    expect: 'claude-standards-audit',
  },
  {
    prompt: 'Open a new entry on the task board for this piece of work.',
    expect: 'claude-tasks',
  },
  {
    prompt: 'Open a learning workspace so I can study this topic properly.',
    expect: 'claude-teach',
  },
  {
    prompt: 'Generate the Playwright tests I need after this UI change.',
    expect: 'claude-ui-test',
  },
  {
    prompt:
      'Look over the interface and tell me what feels unfinished or confusing.',
    expect: 'claude-ux-audit',
  },
  {
    prompt: 'Tell me the paint and layout cost of this page right now.',
    expect: 'claude-ux-measure',
  },
  {
    prompt:
      'I am building this branch for another session. What am I on the hook for, and what is off limits?',
    expect: 'claude-worker',
  },
  {
    prompt: 'Get me set up in a fresh Claude Code worktree for this branch.',
    expect: 'claude-worktree',
  },

  // Negatives: pairs whose bodies already carry an explicit Do NOT boundary.
  {
    prompt:
      'Refresh the stale sections of README and the docs folder based on what changed.',
    expect: 'docs-sync',
  },
  {
    prompt: 'Sort through this brain dump and write it up as findings.',
    expect: 'claude-intake',
  },
  {
    prompt:
      "Go through what's still unanswered in the intake folder and decide.",
    expect: 'claude-intake-answer',
  },
  {
    prompt: 'Check this markdown against the house style rules.',
    expect: 'claude-standards-audit',
  },
  {
    prompt: 'Find the rough, unfinished-feeling spots in this interface.',
    expect: 'claude-ux-audit',
  },
  {
    prompt: 'Tell me the render cost of this page in the browser.',
    expect: 'claude-ux-measure',
  },
]
