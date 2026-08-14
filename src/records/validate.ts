import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseFrontmatter, readField } from '@/indexes/frontmatter'
import { linesOutsideFences } from '@/markdown/scan'

export const RECORD_KINDS = [
  'plans',
  'groundwork',
  'intake',
  'memory',
  'standards',
] as const

export type RecordKind = (typeof RECORD_KINDS)[number]

/**
 * The folders each kind reads, in precedence order.
 *
 * Standards carry two because the corpus authors at the project root and
 * installs under `.claude/`. The authoring root wins where both exist, since the
 * installed tree is a generated copy here and a finding fixed there is
 * overwritten by the next regen. A project that consumed the corpus holds only
 * the second, so one order serves both.
 */
const FOLDERS_BY_KIND: Readonly<Record<RecordKind, readonly string[]>> = {
  plans: [join('.claude', 'plans')],
  groundwork: [join('.claude', 'groundwork')],
  intake: [join('.claude', 'intake')],
  memory: [join('.claude', 'memory')],
  standards: ['standards', join('.claude', 'standards')],
}

/**
 * `unknown-kind` is raised at the argument boundary rather than by the walk, and
 * it sits here because both reach a caller through the same `reason` field. A
 * union covering only what the walk returns would type a record the command can
 * emit as impossible.
 */
export const VALIDATE_REFUSALS = ['no-folder', 'unknown-kind'] as const

export type ValidateRefusal = (typeof VALIDATE_REFUSALS)[number]

export const FINDING_KINDS = [
  'name-malformed',
  'title-missing',
  'title-is-slug',
  'section-missing',
  'scope-unanchored',
  'entry-unreasoned',
  'suggestion-missing',
  'question-unanswerable',
  'frontmatter-incomplete',
  'date-malformed',
  'index-missing',
  'state-missing',
  'closing-partial',
  'item-incomplete',
  'category-mismatch',
] as const

export type FindingKind = (typeof FINDING_KINDS)[number]

export interface Finding {
  readonly kind: FindingKind
  /** The record the finding sits in, relative to the validated folder. */
  readonly record: string
  readonly subject: string
  readonly message: string
}

export interface ValidateReport {
  readonly ok: true
  readonly kind: RecordKind
  readonly records: number
  readonly findings: readonly Finding[]
}

export interface ValidateRefused {
  readonly ok: false
  readonly reason: ValidateRefusal
  readonly message: string
}

export type ValidateOutcome = ValidateReport | ValidateRefused

/** Every folder a kind would accept, whether or not it is on disk. */
export function recordDirs(root: string, kind: RecordKind): string[] {
  return FOLDERS_BY_KIND[kind].map((folder) => join(root, folder))
}

/**
 * The folder a kind reads. The first candidate on disk wins, and the first
 * candidate stands in when none exists, so a refusal and a test fixture both
 * name the location the kind prefers.
 */
export function recordsDir(root: string, kind: RecordKind): string {
  const dirs = recordDirs(root, kind)
  return dirs.find((dir) => existsSync(dir)) ?? dirs[0]
}

export function isRecordKind(value: string): value is RecordKind {
  return (RECORD_KINDS as readonly string[]).includes(value)
}

/**
 * Whether a kind's folder is shared session scratch at the main worktree root.
 *
 * The four record folders are, so every session validates the records every
 * other session reads. The corpus is tracked instead, so a linked worktree holds
 * its own edited copy, and defaulting that kind to the main root would report on
 * a tree the session never touched and say nothing about which one it read.
 */
export function isSharedScratch(kind: RecordKind): boolean {
  return kind !== 'standards'
}

const NONE_IDENTIFIED = 'None identified.'
const NUMBERED_FILE = /^\d{2}-[a-z0-9]+(-[a-z0-9]+)*\.md$/

function finding(
  kind: FindingKind,
  record: string,
  subject: string,
  message: string,
): Finding {
  return { kind, record, subject, message }
}

async function listMarkdown(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort()
}

async function listFolders(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

const PLAN_NAME = /^feature-[a-z0-9]+(-[a-z0-9]+)*\.md$/
const PLAN_TITLE = /^#[ \t]+Feature:[ \t]+\S/
/**
 * An entry names a file and says something about it. Both halves are tested as
 * facts rather than as a syntax: a backticked span anywhere, and prose left over
 * once the spans are removed.
 *
 * Requiring the path to lead and the reason to follow a colon was the first
 * shape and it reported 80 of 178 archived plans. The corpus writes
 * `- Label: prose naming a path` as often as `- path: reason`, and both name the
 * file and say why, so the stricter rule measured a house style rather than a
 * defect.
 */
function statesReason(entry: string): boolean {
  if (!/`[^`]+`/.test(entry)) return false

  const prose = entry.replace(/`[^`]*`/g, '').replace(/^-[ \t]*/, '')
  return /[A-Za-z0-9]/.test(prose)
}
const QUESTION_ITEM = /^\d+[a-z]?\.[ \t]+\S/

const PLAN_SECTIONS = [
  'Summary',
  'Constraints',
  'Files to touch',
  'Risks',
  'Questions',
] as const

type PlanSection = (typeof PLAN_SECTIONS)[number]

const PLAN_REQUIRED: readonly PlanSection[] = [
  'Summary',
  'Files to touch',
  'Risks',
  'Questions',
]

/**
 * A line standing alone as a bold label or an H2, whatever it names. A plan is
 * free to carry a section of its own, so the split has to see one to close the
 * section above it.
 */
const MARKER_LINE = /^(?:##[ \t]+(.+?)|\*\*(.+?):\*\*)[ \t]*$/

/**
 * A section opens as a bold label or as an H2 and both count. The corpus writes
 * `Summary` as a heading and the other four as bold labels, and roughly a fifth
 * of it swaps one for the other. Reporting the variant would fail nearly every
 * plan present on the rule a reader is least served by, which is what teaches
 * them to skip the output.
 */
export function sectionMarker(line: string): PlanSection | undefined {
  const match = MARKER_LINE.exec(line.trim())
  if (!match) return undefined

  const name = match[1] ?? match[2]
  return PLAN_SECTIONS.find((entry) => entry === name)
}

/** The spelling a finding names, which is the one the standard's template ships. */
export function preferredMarker(section: PlanSection): string {
  return section === 'Summary' ? '## Summary' : `**${section}:**`
}

export function splitPlanSections(text: string): Map<string, string[]> {
  const sections = new Map<string, string[]>()
  let current: string | undefined

  for (const line of linesOutsideFences(text)) {
    // Any marker-shaped line closes the section above it, and only a recognized
    // one opens a section. A plan carrying a label of its own would otherwise
    // collect its bullets into whichever section came before.
    if (MARKER_LINE.test(line.trim())) {
      current = sectionMarker(line)
      if (current) sections.set(current, [])
      continue
    }

    if (current) sections.get(current)?.push(line)
  }

  return sections
}

interface Question {
  readonly label: string
  readonly body: readonly string[]
}

export function readQuestions(lines: readonly string[]): Question[] {
  const questions: { label: string; body: string[] }[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (QUESTION_ITEM.test(trimmed)) {
      questions.push({ label: trimmed, body: [] })
      continue
    }

    questions.at(-1)?.body.push(trimmed)
  }

  return questions
}

function shorten(label: string): string {
  return label.length > 60 ? `${label.slice(0, 57)}...` : label
}

function checkQuestionContract(name: string, lines: string[]): Finding[] {
  if (lines.some((line) => line.trim() === NONE_IDENTIFIED)) return []

  const findings: Finding[] = []

  for (const question of readQuestions(lines)) {
    const subject = shorten(question.label)

    if (!question.body.some((line) => line.startsWith('- Suggested:'))) {
      findings.push(
        finding(
          'suggestion-missing',
          name,
          subject,
          'carries no Suggested line, so it arrives at execution as a stop.',
        ),
      )
    }

    if (!question.body.some((line) => line.startsWith('- Answer:'))) {
      findings.push(
        finding(
          'question-unanswerable',
          name,
          subject,
          'carries no Answer slot, so the blank-answer default has nowhere to sit.',
        ),
      )
    }
  }

  return findings
}

export function checkPlan(name: string, text: string): Finding[] {
  const findings: Finding[] = []

  if (!PLAN_NAME.test(name)) {
    findings.push(
      finding(
        'name-malformed',
        name,
        name,
        'is not named feature-<slug>.md with a kebab-case slug.',
      ),
    )
  }

  const lines = linesOutsideFences(text)

  if (!lines.some((line) => PLAN_TITLE.test(line))) {
    findings.push(
      finding('title-missing', name, name, 'opens with no # Feature: heading.'),
    )
  }

  const sections = splitPlanSections(text)

  for (const marker of PLAN_REQUIRED) {
    if (!sections.has(marker)) {
      findings.push(
        finding(
          'section-missing',
          name,
          preferredMarker(marker),
          'is required and the plan carries no such section.',
        ),
      )
    }
  }

  for (const line of sections.get('Files to touch') ?? []) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('- ') || trimmed === `- ${NONE_IDENTIFIED}`)
      continue

    if (!statesReason(trimmed)) {
      findings.push(
        finding(
          'entry-unreasoned',
          name,
          shorten(trimmed),
          'names no file, or names one and says nothing about it.',
        ),
      )
    }
  }

  findings.push(...checkQuestionContract(name, sections.get('Questions') ?? []))

  return findings
}

const DATE_FIELD = /^date:[ \t]*'?"?(\d{4}-\d{2}-\d{2})'?"?[ \t]*$/m

/**
 * Reads the opening date off the raw block rather than the parsed fields. A YAML
 * parser resolves an unquoted `YYYY-MM-DD` to a date value on the core schema
 * and to a string elsewhere, and a check keyed on the parsed type would report a
 * conforming file on one runtime and not the other.
 */
function hasOpeningDate(raw: string): boolean {
  return DATE_FIELD.test(raw)
}

async function checkFolderFrontmatter(
  dir: string,
  slug: string,
  files: readonly string[],
  indexFile: string,
): Promise<Finding[]> {
  const perFile = await Promise.all(
    files.map(async (file) => {
      const found: Finding[] = []
      const frontmatter = parseFrontmatter(
        await readFile(join(dir, file), 'utf8'),
      )

      const missing = ['title', 'description'].filter(
        (field) => !readField(frontmatter, field),
      )

      if (missing.length > 0) {
        found.push(
          finding(
            'frontmatter-incomplete',
            slug,
            file,
            `carries no ${missing.join(' and no ')}.`,
          ),
        )
      }

      if (file === indexFile && !hasOpeningDate(frontmatter?.raw ?? '')) {
        found.push(
          finding(
            'date-malformed',
            slug,
            file,
            'carries no date field as YYYY-MM-DD, so the folder states no opening day.',
          ),
        )
      }

      if (file !== indexFile && !NUMBERED_FILE.test(file)) {
        found.push(
          finding(
            'name-malformed',
            slug,
            file,
            'is not numbered NN-<name>.md, so the folder has no read order.',
          ),
        )
      }

      return found
    }),
  )

  return perFile.flat()
}

const GROUNDWORK_INDEX = 'README.md'
const GROUNDWORK_STATE = '01-current-state.md'
const GROUNDWORK_DECISION = '06-'
const GROUNDWORK_HANDOFF = '07-'

async function checkTrack(dir: string, slug: string): Promise<Finding[]> {
  const files = await listMarkdown(dir)
  const findings: Finding[] = []

  if (!files.includes(GROUNDWORK_INDEX)) {
    findings.push(
      finding(
        'index-missing',
        slug,
        GROUNDWORK_INDEX,
        'is absent, so the track carries no file map and no reason it is running.',
      ),
    )
  }

  if (!files.includes(GROUNDWORK_STATE)) {
    findings.push(
      finding(
        'state-missing',
        slug,
        GROUNDWORK_STATE,
        'is absent, so the track states no measured current state.',
      ),
    )
  }

  // A track closes on the decision and the handoff together. One without the
  // other reads as closed to anyone scanning filenames and strands the half a
  // returning session actually opens.
  const decided = files.some((file) => file.startsWith(GROUNDWORK_DECISION))
  const handed = files.some((file) => file.startsWith(GROUNDWORK_HANDOFF))

  if (decided !== handed) {
    findings.push(
      finding(
        'closing-partial',
        slug,
        decided ? GROUNDWORK_HANDOFF : GROUNDWORK_DECISION,
        `is absent while ${decided ? '06' : '07'} is present, so the track is neither live nor closed.`,
      ),
    )
  }

  findings.push(
    ...(await checkFolderFrontmatter(dir, slug, files, GROUNDWORK_INDEX)),
  )

  return findings
}

const INTAKE_INDEX = '00-overview.md'
const INTAKE_HANDOFF = '99-next-session.md'

const ITEM_HEADING = /^###[ \t]+\S/
const ITEM_REQUIRED = ['Problem', 'Fix', 'Worth it', 'You'] as const

function bulletLabel(line: string): string | undefined {
  const match = /^-[ \t]+\*\*([^:*]+):\*\*/.exec(line.trim())
  return match ? match[1].trim() : undefined
}

export function checkItems(
  slug: string,
  file: string,
  text: string,
): Finding[] {
  const findings: Finding[] = []
  const items: { heading: string; labels: string[] }[] = []

  for (const line of linesOutsideFences(text)) {
    if (ITEM_HEADING.test(line)) {
      items.push({ heading: line.trim().replace(/^###[ \t]+/, ''), labels: [] })
      continue
    }

    const label = bulletLabel(line)
    if (label) items.at(-1)?.labels.push(label)
  }

  for (const item of items) {
    const missing = ITEM_REQUIRED.filter(
      (label) => !item.labels.includes(label),
    )

    if (missing.length > 0) {
      findings.push(
        finding(
          'item-incomplete',
          slug,
          `${file}: ${shorten(item.heading)}`,
          `states no ${missing.join(', no ')}.`,
        ),
      )
    }

    if (item.labels.includes('Open') && !item.labels.includes('Suggested')) {
      findings.push(
        finding(
          'suggestion-missing',
          slug,
          `${file}: ${shorten(item.heading)}`,
          'asks an open question and suggests nothing, so a bare answer decides it.',
        ),
      )
    }
  }

  return findings
}

async function checkDump(dir: string, slug: string): Promise<Finding[]> {
  const files = await listMarkdown(dir)
  const findings: Finding[] = []

  if (!files.includes(INTAKE_INDEX)) {
    findings.push(
      finding(
        'index-missing',
        slug,
        INTAKE_INDEX,
        'is absent, so the dump carries no cluster table and no verdict counts.',
      ),
    )
  }

  findings.push(
    ...(await checkFolderFrontmatter(dir, slug, files, INTAKE_INDEX)),
  )

  // The two reserved files hold no items. Running the item check over the
  // handoff would report every heading it carries as a malformed item.
  const clusters = files.filter(
    (file) => file !== INTAKE_INDEX && file !== INTAKE_HANDOFF,
  )

  const perCluster = await Promise.all(
    clusters.map(async (file) =>
      checkItems(slug, file, await readFile(join(dir, file), 'utf8')),
    ),
  )

  return [...findings, ...perCluster.flat()]
}

const MEMORY_INDEX = 'index.md'
const MEMORY_FIELDS = ['title', 'description', 'category'] as const

/**
 * The filename prefix and the `category` field are one fact in two spellings,
 * so the map is the whole type list and the comparison against it is what
 * catches a prefix outside the set, a field disagreeing with the prefix, and a
 * casing drift that would open a second group in the catalog.
 */
const CATEGORY_BY_TYPE = {
  feedback: 'Feedback',
  project: 'Project',
  user: 'User',
  reference: 'Reference',
} as const

type MemoryType = keyof typeof CATEGORY_BY_TYPE

const MEMORY_TYPES = Object.keys(CATEGORY_BY_TYPE) as readonly MemoryType[]

const MEMORY_NAME = /^([a-z]+)-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/

/** The two markers a rule-bearing body carries, on top of the rule line itself. */
const MEMORY_MARKERS = ['**Why:**', '**How to apply:**'] as const

function memoryType(value: string): MemoryType | undefined {
  return MEMORY_TYPES.find((type) => type === value)
}

export function checkMemory(name: string, text: string): Finding[] {
  const findings: Finding[] = []
  const match = MEMORY_NAME.exec(name)
  const named = match ? memoryType(match[1]) : undefined

  if (!named) {
    findings.push(
      finding(
        'name-malformed',
        name,
        name,
        `is not named <type>-<slug>.md with a type of ${MEMORY_TYPES.join(', ')}.`,
      ),
    )
  }

  const frontmatter = parseFrontmatter(text)
  const missing = MEMORY_FIELDS.filter(
    (field) => !readField(frontmatter, field),
  )

  if (missing.length > 0) {
    findings.push(
      finding(
        'frontmatter-incomplete',
        name,
        name,
        `carries no ${missing.join(' and no ')}.`,
      ),
    )
  }

  // Its own kind rather than `title-missing`, which means an absent heading on a
  // plan. One kind covering both leaves a caller filtering the JSON unable to
  // tell a record with no title from one whose title is its own slug.
  if (readField(frontmatter, 'title') === name.replace(/\.md$/, '')) {
    findings.push(
      finding(
        'title-is-slug',
        name,
        name,
        'is titled with its own filename, so the catalog renders a slug where the rule belongs.',
      ),
    )
  }

  const category = readField(frontmatter, 'category')

  // Reported against the prefix alone. A name the prefix rule already failed
  // has no type to compare against, and reporting it twice names one defect as
  // two.
  if (named && category && category !== CATEGORY_BY_TYPE[named]) {
    findings.push(
      finding(
        'category-mismatch',
        name,
        category,
        `is not ${CATEGORY_BY_TYPE[named]}, which the filename prefix declares.`,
      ),
    )
  }

  return [
    ...findings,
    ...checkMemoryBody(
      name,
      text.slice(frontmatter?.raw.length ?? 0),
      named ?? category,
    ),
  ]
}

/**
 * A `user` or `reference` entry is a single sentence by design, so the markers
 * are checked only where a rule is being stated. The type is read off the
 * prefix, falling back to the category so a misnamed file is still checked
 * against the shape it claims.
 */
function checkMemoryBody(
  name: string,
  text: string,
  claimed: string | undefined,
): Finding[] {
  const type = claimed && memoryType(claimed.toLowerCase())
  if (type !== 'feedback' && type !== 'project') return []

  const body = linesOutsideFences(text).filter((line) => line.trim().length > 0)

  const findings: Finding[] = []
  const opening = body[0]

  if (!opening || MEMORY_MARKERS.some((marker) => opening.startsWith(marker))) {
    findings.push(
      finding(
        'section-missing',
        name,
        'the rule line',
        'is absent, so the entry carries a rationale with no rule to apply.',
      ),
    )
  }

  for (const marker of MEMORY_MARKERS) {
    if (!body.some((line) => line.startsWith(marker))) {
      findings.push(
        finding(
          'section-missing',
          name,
          marker,
          `is required on a ${type} entry and the body carries no such line.`,
        ),
      )
    }
  }

  return findings
}

const STANDARD_INDEX = 'index.md'
const STANDARD_FIELDS = ['title', 'description'] as const

const SCOPE_HEADING = /^##[ \t]+Scope[ \t]*$/
const ANY_HEADING = /^#{1,6}[ \t]+\S/
const DOES_NOT_GOVERN = 'Does not govern:'
const ATTRIBUTE_MARKER = 'attribute standard'
const CODE_SPAN = /`([^`]+)`/g

interface Scope {
  /** The first non-blank line under the heading, which is the statement. */
  readonly statement: string
  readonly lines: readonly string[]
}

export function readScope(text: string): Scope | undefined {
  const lines = linesOutsideFences(text)
  const opened = lines.findIndex((line) => SCOPE_HEADING.test(line.trim()))
  if (opened === -1) return undefined

  const body: string[] = []

  for (const line of lines.slice(opened + 1)) {
    if (ANY_HEADING.test(line.trim())) break
    body.push(line)
  }

  const statement = body.find((line) => line.trim().length > 0)

  return { statement: statement?.trim() ?? '', lines: body }
}

/**
 * The paths a scope statement declares, read the way `scripts/standards/list.sh`
 * reads them for the catalog's `appliesTo` field: backticked spans in the first
 * sentence alone. One sentence read two ways would let a standard pass here
 * while publishing a different jurisdiction to every consumer of the catalog.
 */
export function governedPaths(statement: string): string[] {
  const [sentence] = statement.split('. ')
  return [...sentence.matchAll(CODE_SPAN)].map((match) => match[1])
}

/**
 * The words a governed path offers a filename. Each segment gives its own word
 * and, where it carries a prefix or a placeholder, the parts either side of a
 * hyphen, so `.claude/tasks/session-<slug>.md` offers `tasks` and `session`.
 *
 * A dotted segment gives nothing. It names the folder holding the artifact
 * rather than the artifact, and a standard named for it would pass this check
 * while naming the container every sibling shares.
 */
export function pathWords(path: string): string[] {
  const words: string[] = []

  for (const segment of path.split('/')) {
    if (segment.startsWith('.')) continue

    const stem = segment.replace(/\.[a-z]+$/i, '').toLowerCase()
    words.push(stem)
    if (stem.includes('-')) words.push(...stem.split('-'))
  }

  return words.filter((word) => /^[a-z]+$/.test(word))
}

/**
 * Accepts the singular and the plural of one word. A standard over a single
 * document is named for the document and one over a folder of them is named for
 * either, and picking a side would report a conforming half of the corpus.
 */
function namesWord(stem: string, word: string): boolean {
  return stem === word || `${stem}s` === word || stem === `${word}s`
}

function checkStandardName(name: string, statement: string): Finding[] {
  const paths = governedPaths(statement)

  // The marker is read only where the first sentence backticks nothing, which
  // is the catalog's own rule. A statement naming a path publishes that path
  // however the rest of the statement describes itself.
  if (paths.length === 0) {
    if (statement.includes(ATTRIBUTE_MARKER)) return []

    return [
      finding(
        'scope-unanchored',
        name,
        name,
        'backticks no path in its first scope sentence and does not call itself an attribute standard, so it names no artifact to be named for.',
      ),
    ]
  }

  const stem = name.replace(/\.md$/, '')
  const words = paths.flatMap(pathWords)

  if (words.some((word) => namesWord(stem, word))) return []

  return [
    finding(
      'name-malformed',
      name,
      name,
      `names no part of ${paths.join(', ')}, which is what it governs. A rename reaches every target that installed the corpus and every surface citing it by bare filename.`,
    ),
  ]
}

export function checkStandard(name: string, text: string): Finding[] {
  const findings: Finding[] = []
  const frontmatter = parseFrontmatter(text)

  const missing = STANDARD_FIELDS.filter(
    (field) => !readField(frontmatter, field),
  )

  if (missing.length > 0) {
    findings.push(
      finding(
        'frontmatter-incomplete',
        name,
        name,
        `carries no ${missing.join(' and no ')}.`,
      ),
    )
  }

  const scope = readScope(text)

  // The name derives from the scope statement, so an absent section leaves
  // nothing to derive against. Reporting the name as well would name one defect
  // twice and point the fix at the wrong file.
  if (!scope) {
    return [
      ...findings,
      finding(
        'section-missing',
        name,
        '## Scope',
        'is absent, so the standard claims no jurisdiction and can refuse no rule.',
      ),
    ]
  }

  if (!scope.lines.some((line) => line.trim().startsWith(DOES_NOT_GOVERN))) {
    findings.push(
      finding(
        'section-missing',
        name,
        DOES_NOT_GOVERN,
        'is absent from the scope section, so no boundary names the owner it hands off to.',
      ),
    )
  }

  return [...findings, ...checkStandardName(name, scope.statement)]
}

function refuse(reason: ValidateRefusal, message: string): ValidateRefused {
  return { ok: false, reason, message }
}

/** The walk for a kind whose records are files in one flat folder. */
async function validateFiles(
  dir: string,
  kind: RecordKind,
  check: (name: string, text: string) => Finding[],
  skip: (file: string) => boolean = () => false,
): Promise<ValidateReport> {
  const files = (await listMarkdown(dir)).filter((file) => !skip(file))

  const perFile = await Promise.all(
    files.map(async (file) =>
      check(file, await readFile(join(dir, file), 'utf8')),
    ),
  )

  return { ok: true, kind, records: files.length, findings: perFile.flat() }
}

/**
 * Reports what every record in one folder claims against the shape its standard
 * fixes. It writes nothing whichever kind runs, and the reason differs by kind.
 * A session record is per-machine scratch with no history behind it, so a repair
 * that guessed wrong could not be undone. A standard installs into every target
 * and is cited by bare filename, so a rename costs more than the file move it
 * looks like.
 */
export async function validateRecords(
  root: string,
  kind: RecordKind,
): Promise<ValidateOutcome> {
  const dir = recordsDir(root, kind)

  if (!existsSync(dir)) {
    return refuse(
      'no-folder',
      `No ${kind} folder at ${recordDirs(root, kind).join(' or ')}.`,
    )
  }

  if (kind === 'plans') return validateFiles(dir, kind, checkPlan)

  if (kind === 'memory') {
    return validateFiles(
      dir,
      kind,
      checkMemory,
      (file) => file === MEMORY_INDEX,
    )
  }

  // The walk stays flat, matching install and the catalog. `standards/bundled/`
  // is a subfolder whose members are named for the skill that reads them rather
  // than for a path they govern, so the derivation below reports every one.
  if (kind === 'standards') {
    return validateFiles(
      dir,
      kind,
      checkStandard,
      (file) => file === STANDARD_INDEX,
    )
  }

  const folders = await listFolders(dir)
  const check = kind === 'groundwork' ? checkTrack : checkDump
  const perFolder = await Promise.all(
    folders.map((slug) => check(join(dir, slug), slug)),
  )

  return { ok: true, kind, records: folders.length, findings: perFolder.flat() }
}
