import { defineRenameRules, type RenameRules } from '@/migrate/rename'

/**
 * The twenty-five shipped skills that carried a `claude-` prefix, and the
 * two-word name each takes instead, plus the four that carried a `canon-`
 * prefix naming a subject other than the toolkit itself.
 *
 * The plugin namespace already resolves every one of them as `canon:<name>`,
 * so the prefix bought grouping rather than uniqueness, and the grouping it
 * bought was the wrong axis: it marked which surface a skill reads rather than
 * what the skill does. The prefixes that replace it name a phase or a role, so
 * a listing groups the review triple, the three planning skills, and the three
 * session roles together.
 *
 * The four `canon-` rows split the same way rather than sharing one
 * replacement prefix. `canon-screencast` and `canon-slides-draft` draft a
 * document, which is what the `draft-` family already means across its other
 * members, so they join it as `draft-screencast` and `draft-slides`.
 * `canon-record` and `canon-frames-read` are not drafting anything, so each
 * takes a standalone verb-first name, `record-screencast` and `read-frames`,
 * reading in sequence with `draft-screencast` as one three-step pipeline with
 * no prefix forcing that reading.
 *
 * Every name takes two words. Ten of these would have landed as a bare single
 * word under a plain strip, and a bare word such as `review` or `docs` is a
 * substring of ordinary prose with no token left for a later sweep to find.
 */
export const SKILL_NAME_MAP: Readonly<Record<string, string>> = {
  'claude-address-review': 'review-address',
  'claude-autoship': 'auto-ship',
  'claude-design-extract': 'design-extract',
  'claude-diagram': 'draft-diagram',
  'claude-docs': 'docs-fold',
  'claude-feature': 'plan-feature',
  'claude-groundwork': 'plan-groundwork',
  'claude-intake': 'plan-intake',
  'claude-intake-answer': 'plan-intake-answer',
  'claude-markdown-propose': 'markdown-propose',
  'claude-memory-capture': 'memory-capture',
  'claude-memory-review': 'memory-review',
  'claude-orchestrate': 'role-orchestrator',
  'claude-planner': 'role-planner',
  'claude-pr-review': 'review-pr',
  'claude-review': 'review-branch',
  'claude-seed-sync': 'seed-sync',
  'claude-standards-audit': 'standards-audit',
  'claude-tasks': 'task-board',
  'claude-teach': 'teach-workspace',
  'claude-ui-test': 'ui-test',
  'claude-ux-audit': 'ux-audit',
  'claude-ux-measure': 'ux-measure',
  'claude-worker': 'role-worker',
  'claude-worktree': 'session-worktree',
  'canon-screencast': 'draft-screencast',
  'canon-slides-draft': 'draft-slides',
  'canon-record': 'record-screencast',
  'canon-frames-read': 'read-frames',
}

/**
 * The skill rename.
 *
 * It protects nothing. The `aitk` sweep had to guard a sibling repository
 * whose name contained the token, and no string here contains a skill name
 * while meaning something else: the one overlap in the map is
 * `claude-intake` inside `claude-intake-answer`, which the longest-first
 * ordering settles rather than a protected form. Reading that off the output
 * would report a pass either way, since both rows land on a name opening with
 * `plan-intake`, so the ordering is asserted directly.
 *
 * It matches whole tokens. A skill name is a complete name rather than a word
 * stem, and the corpus holds one word that opens with a name and means
 * something else: `wiki/claude/claude-worktrees.md` documents the harness
 * feature, not the skill, and every sibling in that folder is named
 * `claude-<topic>.md` for a Claude Code concept. Sixteen occurrences of it
 * would have moved to a name the folder's own convention contradicts.
 *
 * No article fixup travels with it. `auto-ship` is the one destination opening
 * on a vowel sound, and the corpus spells an article before it once, which is
 * cheaper to repair by hand than to state as a rule the rest of the map never
 * fires.
 *
 * The map's own module and its test state the rename rather than using the old
 * names, so a sweep over them turns each key into its own replacement and
 * leaves a rewriter that matches nothing. The changelog and an eval transcript
 * are excluded on the argument the `aitk` preset already carries: each records
 * what shipped or what a session ran under whatever name was current then, so
 * rewriting one makes it testify to a release or a run that never happened.
 *
 * The record archives need no entry here. They are gitignored, so the tracked
 * listing every sweep reads never reaches them.
 */
export const SKILL_NAME_RULES: RenameRules = defineRenameRules({
  replacements: SKILL_NAME_MAP,
  keepMarker: 'canon-keep-retired',
  wholeToken: true,
  excludedPrefixes: ['scripts/eval/result-'],
  excludedPaths: [
    'CHANGELOG.md',
    'src/migrate/skill-names.ts',
    'src/migrate/skill-names.test.ts',
  ],
})
