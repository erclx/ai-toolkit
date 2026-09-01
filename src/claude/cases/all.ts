import type { SkillCase } from '@/claude/skills-rank'
import { AUTHORING_CASES } from '@/claude/cases/authoring'
import { CLAUDE_WORKFLOW_CASES } from '@/claude/cases/claude-workflow'
import { GIT_CASES } from '@/claude/cases/git'
import { MISC_CASES } from '@/claude/cases/misc'
import { SETUP_CASES } from '@/claude/cases/setup'

/**
 * The full routing case corpus, one file per domain so a description change
 * in one family touches only the file beside it.
 *
 * Bootstrapped from each skill's own quoted trigger phrases and then
 * rephrased and supplemented rather than shipped verbatim, since a positive
 * lifted unchanged from a trigger passes by construction and never tests a
 * person's own words. See `.canon/groundwork/42-ai-blueprint/08-spikes.md`
 * for the extraction arm this corpus replaces as the shipped measure.
 */
export const SKILL_CASES: readonly SkillCase[] = [
  ...CLAUDE_WORKFLOW_CASES,
  ...GIT_CASES,
  ...SETUP_CASES,
  ...AUTHORING_CASES,
  ...MISC_CASES,
]
