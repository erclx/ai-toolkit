import {
  auditSet,
  heroStamp,
  markdownBans,
  type Measure,
  pluginManifests,
  sandboxCoverage,
  seedStandards,
  standardCriteria,
  unreferencedRules,
} from '@/gate/measures'

/**
 * One thing a stage does, as an argument vector rather than a shell line.
 *
 * The script this replaces held every check as text and handed it to `eval`,
 * which made each stage a quoting question: whether the string wanted a shell
 * or was an argument list that should never see one. Nothing in the set turned
 * out to depend on expansion once the drift assertion stopped being a shell
 * line, so the whole table is vectors and the hazard is gone rather than
 * carried forward.
 */
export type Check =
  /** Any binary on PATH, or a script named by path under the project root. */
  | {
      readonly kind: 'command'
      readonly argv: readonly string[]
      readonly failure: string
    }
  /** This checkout's own CLI, so a worktree gate never reads the main tree. */
  | {
      readonly kind: 'cli'
      readonly argv: readonly string[]
      readonly failure: string
    }
  /**
   * A regenerated surface asserted against the index and the working tree.
   *
   * Both halves are read, since a regen emitting a file nobody ever committed
   * satisfies a diff and fails here. The pathspec is one argument rather than a
   * shell word, which is what git already receives: `*` matches a slash in a
   * pathspec, so `*index.md` reaches a nested index the way it always did.
   */
  | {
      readonly kind: 'drift'
      readonly pathspec: string
      readonly failure: string
    }
  /** A reading whose verdict is a comparison rather than an exit code. */
  | { readonly kind: 'measure'; readonly measure: Measure }

export interface Stage {
  readonly id: string
  /** The heading this stage prints, matching the frame it replaces. */
  readonly label: string
  /**
   * The changed-file pattern this stage needs before it runs. Absent means the
   * stage always runs, which is correct wherever the input is diffuse enough
   * that no path predicts it.
   */
  readonly scope?: RegExp
  /** What a scoped-out stage says, so a skip never reads as a pass. */
  readonly skipped?: string
  /**
   * Whether this stage belongs in the run at all, read off the write grant
   * rather than the changed set. Absent means it always belongs.
   */
  readonly when?: (options: { readonly write: boolean }) => boolean
  readonly checks: readonly Check[]
  /** The line a clean stage prints, where the checks emit none of their own. */
  readonly success?: string
}

/**
 * Corpora a `src/` test asserts over from outside `src/`, censused in
 * `.claude/context/development/verification.md`. This list and that census are
 * two copies of one set with nothing comparing them, so a corpus joining the
 * census joins this list in the same change. The first four are directory
 * prefixes because their tests walk the tree whole, which is what reaches a
 * rule or a skill a branch adds rather than edits.
 */
export const TEST_CORPORA_PATTERNS = [
  '^claude/skills/',
  '^governance/rules/',
  '^\\.claude/hooks/',
  '^tooling/claude/seeds/\\.claude/hooks/',
  '^standards/markdown\\.md$',
  '^tooling/base/reference\\.md$',
  '^tooling/web/configs/scripts/worktree-port\\.sh$',
  '^\\.cspell/banned-spellings\\.txt$',
  '^scripts/lib/worktree\\.sh$',
  '^scripts/core/check-ignore-parity\\.sh$',
]

const TESTS_SCOPE = new RegExp(
  [
    '^src/',
    '^vitest\\.config\\.ts$',
    '^tsconfig\\.json$',
    '^package\\.json$',
    ...TEST_CORPORA_PATTERNS,
  ].join('|'),
)

const script = (name: string, failure: string): Check => ({
  kind: 'command',
  argv: ['bash', `scripts/core/${name}`],
  failure,
})

/**
 * Every stage the gate runs, in the order it runs them.
 *
 * Order is the product here rather than an accident of the file. The four
 * regenerating stages run before anything reads what they wrote, the stages
 * calling this checkout's CLI sit together so a reader meets one group rather
 * than the same kind of stage at intervals, and the three scoped stages sit
 * last where a skip costs the run nothing it already paid for.
 *
 * A stage halts the run when one of its checks fails, so clearing a
 * regenerate-then-assert stage reveals the next one behind it rather than the
 * whole set at once.
 */
export const STAGES: readonly Stage[] = [
  {
    id: 'format',
    label: 'Formatting',
    when: ({ write }) => write,
    checks: [
      {
        kind: 'command',
        argv: ['bun', 'run', 'format'],
        failure: 'Format failed',
      },
    ],
    success: 'Format applied',
  },
  {
    id: 'format-check',
    label: 'Format check',
    when: ({ write }) => !write,
    checks: [
      {
        kind: 'command',
        argv: ['bun', 'run', 'check:format'],
        failure: 'Format check failed',
      },
    ],
    success: 'Format check passed',
  },
  {
    id: 'indexes',
    label: 'Indexes',
    checks: [
      script('regen-indexes.sh', 'Index regen failed'),
      {
        kind: 'drift',
        pathspec: '*index.md',
        failure:
          'Indexes drifted. Run bun run check and commit the updated index files.',
      },
    ],
    success: 'Indexes clean',
  },
  {
    id: 'consumed-copies',
    label: 'Consumed copies',
    checks: [
      script('regen-claude-copies.sh', 'Consumed-copy regen failed'),
      {
        kind: 'drift',
        pathspec: '.claude/rules',
        failure:
          'Consumed copies drifted. Run bun run check and commit .claude/rules.',
      },
    ],
    success: 'Consumed copies clean',
  },
  {
    // Only the markup is asserted for drift. The image beside it is a chromium
    // render whose bytes move with the browser version, so a drift check over it
    // would fail on a machine whose chromium differs rather than on a stale
    // count. The stamp measure below is what covers the image instead.
    id: 'hero',
    label: 'Hero',
    checks: [
      script('regen-hero.sh', 'Hero regen failed'),
      {
        kind: 'drift',
        pathspec: 'assets/hero.html',
        failure:
          'Hero counts drifted. Run bun run check, then canon capture assets/hero.html, and commit assets/hero.html with assets/hero.png and assets/hero.stamp.',
      },
      { kind: 'measure', measure: heroStamp },
    ],
    success: 'Hero clean',
  },
  {
    id: 'tooling-paths',
    label: 'Tooling paths',
    checks: [
      script('regen-tooling-paths.sh', 'Tooling-path regen failed'),
      {
        kind: 'drift',
        pathspec: 'claude/skills/canon-cli/SKILL.md',
        failure:
          'The overwrite contract drifted from what the stacks hold. Run bun run check and commit claude/skills/canon-cli/SKILL.md.',
      },
    ],
    success: 'Tooling paths clean',
  },
  {
    // The claude manifest is the only route a target's ignore set travels, and
    // it is hand-maintained beside this repository's own `.gitignore` with
    // nothing comparing the two. A drift between them reaches every target on
    // the next `canon tooling sync` and surfaces to nobody, which is why this
    // gates rather than reports. It is not a drift assert: no generator
    // produces either list, so there is nothing to regenerate and diff.
    id: 'ignore-parity',
    label: 'Ignore parity',
    checks: [
      script(
        'check-ignore-parity.sh',
        "The ignore set a target receives disagrees with this repository's own.",
      ),
    ],
    success: 'Ignore parity clean',
  },
  {
    id: 'skill-paths',
    label: 'Skill paths',
    checks: [
      script(
        'check-skill-paths.sh',
        'Shipped skills reference a repo-local path.',
      ),
    ],
    success: 'Skill paths clean',
  },
  {
    id: 'plugin-boundary',
    label: 'Plugin boundary',
    checks: [
      script(
        'check-plugin-boundary.sh',
        'Plugin ships toolkit-internal content.',
      ),
    ],
    success: 'Plugin boundary clean',
  },
  {
    // Seed prose is installed into every scaffolded project and read there as
    // instruction about that project, so a line naming this repository's CLI
    // hands a target a verb it may not be able to run. This gates for the
    // reason the seed-standards stage below gates: a defect authored once
    // propagates into every project scaffolded after it.
    id: 'seed-independence',
    label: 'Seed independence',
    checks: [
      script('check-seed-independence.sh', 'Seed prose cites the toolkit CLI.'),
    ],
    success: 'Seed prose cites no toolkit CLI',
  },
  {
    // A stack entry naming a rule folder takes every rule in it, which is what
    // stops a new rule from needing a second edit to reach a target. The
    // failure it leaves open is a rule authored into a folder no stack names,
    // which `canon gov install` never reaches on its own.
    id: 'unreferenced-rules',
    label: 'Unreferenced rules',
    checks: [{ kind: 'measure', measure: unreferencedRules }],
  },
  {
    // Only the citation half of the audit gates. Length, depth, table, and
    // index findings are judgment thresholds, and failing a push on one would
    // make the stage something to route around.
    id: 'context-citations',
    label: 'Context citations',
    checks: [
      {
        kind: 'cli',
        argv: ['context', 'audit', '--citations-only'],
        failure:
          'A cited context path does not resolve. Run bun src/cli.ts context audit.',
      },
    ],
    success: 'Context citations resolve',
  },
  {
    // A rule citing a file that moved fails silently. The consumed-copy drift
    // stage passes an authored rule and its copy that are wrong together, and
    // nothing else resolves the path until a session opens it. A rule whose
    // frontmatter glob names a directory that moved fails the same way, by
    // never firing again. The classes where absence is correct are separated
    // inside the verb rather than left as a threshold here.
    id: 'rule-citations',
    label: 'Rule citations',
    checks: [
      {
        kind: 'cli',
        argv: ['gov', 'citations'],
        failure:
          'A path a rule cites, or an internal frontmatter glob, does not resolve. Run bun src/cli.ts gov citations.',
      },
    ],
    success: 'Rule citations resolve',
  },
  {
    id: 'markdown-bans',
    label: 'Markdown bans',
    checks: [{ kind: 'measure', measure: markdownBans }],
  },
  {
    id: 'seed-standards',
    label: 'Seed standards',
    checks: [{ kind: 'measure', measure: seedStandards }],
  },
  {
    // Presence of a required file is a fact, so it gates. The name,
    // description, folder, and requirement-section measures beside it report
    // and are read from a bare run.
    id: 'skill-requirements',
    label: 'Skill requirements',
    checks: [
      {
        kind: 'cli',
        argv: ['claude', 'skills', 'audit', '--requirements-only'],
        failure:
          'A skill folder carries no REQUIREMENT.md. Run bun src/cli.ts claude skills audit.',
      },
    ],
    success: 'Skill requirements present',
  },
  {
    id: 'standard-criteria',
    label: 'Standard success criteria',
    checks: [{ kind: 'measure', measure: standardCriteria }],
  },
  {
    id: 'sandbox-coverage',
    label: 'Sandbox coverage',
    checks: [{ kind: 'measure', measure: sandboxCoverage }],
  },
  {
    id: 'audit-set',
    label: 'Audit set',
    checks: [{ kind: 'measure', measure: auditSet }],
  },
  {
    id: 'plugin-manifests',
    label: 'Plugin manifests',
    checks: [{ kind: 'measure', measure: pluginManifests }],
  },
  {
    id: 'spelling',
    label: 'Spelling',
    checks: [
      {
        kind: 'command',
        argv: ['bun', 'run', 'check:spell'],
        failure: 'Spell check failed',
      },
    ],
    success: 'Spell check passed',
  },
  {
    id: 'shell',
    label: 'Shell',
    scope: /\.sh$|^package\.json$/,
    skipped: 'Skipped, no shell changes',
    checks: [
      {
        kind: 'command',
        argv: ['bun', 'run', 'check:shell'],
        failure: 'Shell check failed',
      },
      script(
        'check-color-source.sh',
        'A color escape is defined outside scripts/lib/ui.sh.',
      ),
    ],
    success: 'Shell check passed',
  },
  {
    id: 'types',
    label: 'Types',
    scope: /^src\/|^tsconfig\.json$|^package\.json$/,
    skipped: 'Skipped, no TypeScript changes',
    checks: [
      {
        kind: 'command',
        argv: ['bun', 'run', 'check:types'],
        failure: 'Typecheck failed',
      },
    ],
    success: 'Typecheck passed',
  },
  {
    id: 'tests',
    label: 'Tests',
    scope: TESTS_SCOPE,
    skipped: 'Skipped, no TypeScript or asserted-corpus changes',
    checks: [
      {
        kind: 'command',
        argv: ['bun', 'run', 'test'],
        failure: 'Tests failed',
      },
    ],
    success: 'Tests passed',
  },
]
