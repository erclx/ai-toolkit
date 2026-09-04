import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { focusLine, generateNav } from '@/teach/nav'
import { openWorkspace, teachDir, writeStylesheet } from '@/teach/workspace'

let ROOT: string

const REQUEST = {
  topic: 'regular-expressions',
  subject: 'Reading and writing regular expressions',
  startingPoint: 'Comfortable with the shell, has never written a group',
  success: ['Write a pattern matching a date', 'Explain a backreference'],
  outOfScope: [],
  date: '2026-08-19',
}

function workspaceDir(slug: string): string {
  return join(teachDir(ROOT), slug)
}

/** The shape the stepper gates, which the skill body now states in full. */
const RADIO_QUIZ = `<div class="quiz">
<div class="q"><p class="q-stem">1. What does a caret anchor?</p>
<label class="opt" data-k="A"><input type="radio" name="q1"><span>The end of the subject</span></label>
<label class="opt" data-k="B"><input type="radio" name="q1" data-a="1"><span>The start of the subject</span></label>
<div class="fb"><b>Correct: the start.</b> The dollar anchors the end.</div></div>
</div>`

/** The shape the four lessons already written carry, kept working by a script. */
const BUTTON_QUIZ = `<div class="quiz">
<div class="q"><p class="q-stem">1. What does a caret anchor?</p>
<button class="opt" data-k="A" data-a="0">The end of the subject</button>
<button class="opt" data-k="B" data-a="1">The start of the subject</button>
<div class="fb"><b>Correct: the start.</b> The dollar anchors the end.</div></div>
</div>`

function lessonSkeleton(h1: string, lede: string, body = ''): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${h1}</title>
<!-- canon:teach:style -->
<!-- /canon:teach:style -->
</head>
<body>
<!-- canon:teach:header -->
<!-- /canon:teach:header -->
<main>
<h1>${h1}</h1>
<p class="lede">${lede}</p>
${body}
</main>
<!-- canon:teach:footnav -->
<!-- /canon:teach:footnav -->
<!-- canon:teach:scripts -->
<!-- /canon:teach:scripts -->
</body>
</html>
`
}

async function seedLesson(
  slug: string,
  file: string,
  h1: string,
  lede: string,
  body = '',
): Promise<string> {
  const dir = join(workspaceDir(slug), 'lessons')
  mkdirSync(dir, { recursive: true })
  const path = join(dir, file)
  await writeFile(path, lessonSkeleton(h1, lede, body))
  return path
}

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'canon-teach-nav-'))
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('focusLine', () => {
  it('should reach the very bottom of the viewport at max scroll', () => {
    for (const innerHeight of [400, 600, 900, 1200, 2000]) {
      expect(focusLine(1000, 1000, innerHeight)).toBe(innerHeight)
    }
  })

  it('should reach a heading with under 120px of trailing content across several viewport heights', () => {
    for (const innerHeight of [400, 600, 900, 1200, 2000]) {
      const max = 3000
      const trailing = 40
      const lastHeadingTopAtRest = max + innerHeight - trailing

      let reached = false
      for (let scrollY = 0; scrollY <= max; scrollY += 5) {
        const top = lastHeadingTopAtRest - scrollY
        if (top <= focusLine(scrollY, max, innerHeight)) {
          reached = true
          break
        }
      }

      expect(reached).toBe(true)
    }
  })

  it('should stay at innerHeight when the page does not scroll', () => {
    expect(focusLine(0, 0, 800)).toBe(800)
  })
})

describe('generateNav', () => {
  it('should refuse a root carrying no teach folder', async () => {
    expect(await generateNav(ROOT)).toMatchObject({
      ok: false,
      reason: 'no-teach',
    })
  })

  it('should create a contents page for a workspace carrying none yet', async () => {
    await openWorkspace(ROOT, REQUEST)
    const path = join(workspaceDir('01-regular-expressions'), 'index.html')
    expect(existsSync(path)).toBe(false)

    const outcome = await generateNav(ROOT)

    expect(outcome).toMatchObject({ ok: true, lessons: 0 })
    expect(existsSync(path)).toBe(true)

    const text = await readFile(path, 'utf8')
    expect(text).toContain('Write a pattern matching a date')
  })

  it('should render the breadcrumb ancestors as links and the current page as plain text', async () => {
    await openWorkspace(ROOT, REQUEST)
    await generateNav(ROOT)

    const root = await readFile(join(teachDir(ROOT), 'index.html'), 'utf8')
    expect(root).toContain('<span class="crumb crumb-here">Workspaces</span>')
    expect(root).not.toContain('<a class="crumb" href="index.html">')

    const contents = await readFile(
      join(workspaceDir('01-regular-expressions'), 'index.html'),
      'utf8',
    )
    expect(contents).toContain(
      '<a class="crumb" href="../index.html">Workspaces</a>',
    )
    expect(contents).toContain(
      '<span class="crumb crumb-here">Regular expressions</span>',
    )
  })

  it('should carry the close-on-outside-click script on every generated page', async () => {
    await openWorkspace(ROOT, REQUEST)
    await writeStylesheet(ROOT, 'regular-expressions')
    await seedLesson(
      '01-regular-expressions',
      '0001-anchors.html',
      'Anchors',
      'Where a pattern starts and ends.',
    )

    await generateNav(ROOT)

    const root = await readFile(join(teachDir(ROOT), 'index.html'), 'utf8')
    const contents = await readFile(
      join(workspaceDir('01-regular-expressions'), 'index.html'),
      'utf8',
    )
    const lesson = await readFile(
      join(
        workspaceDir('01-regular-expressions'),
        'lessons',
        '0001-anchors.html',
      ),
      'utf8',
    )

    for (const page of [root, contents, lesson]) {
      expect(page).toContain('details.jump[open]')
    }
  })

  it('should refuse a lesson missing a chrome marker, leaving it untouched', async () => {
    await openWorkspace(ROOT, REQUEST)
    await writeStylesheet(ROOT, 'regular-expressions')
    const path = join(
      workspaceDir('01-regular-expressions'),
      'lessons',
      '0001-anchors.html',
    )
    mkdirSync(join(workspaceDir('01-regular-expressions'), 'lessons'), {
      recursive: true,
    })
    const original = lessonSkeleton(
      'Anchors',
      'Where a pattern starts.',
    ).replace(
      '<!-- canon:teach:footnav -->\n<!-- /canon:teach:footnav -->\n',
      '',
    )
    await writeFile(path, original)

    const outcome = await generateNav(ROOT)

    expect(outcome).toMatchObject({
      ok: true,
      lessons: 0,
      skipped: [{ missing: 'canon:teach:footnav' }],
    })
    expect(await readFile(path, 'utf8')).toBe(original)
  })

  it('should embed a rule appended to course.css after the lesson was written', async () => {
    await openWorkspace(ROOT, REQUEST)
    await writeStylesheet(ROOT, 'regular-expressions')
    await seedLesson(
      '01-regular-expressions',
      '0001-anchors.html',
      'Anchors',
      'Where a pattern starts and ends.',
    )

    await generateNav(ROOT)

    const cssPath = join(
      workspaceDir('01-regular-expressions'),
      'assets',
      'course.css',
    )
    const css = await readFile(cssPath, 'utf8')
    await writeFile(cssPath, `${css}\n.added-later { color: red; }\n`)

    await generateNav(ROOT)

    const lesson = await readFile(
      join(
        workspaceDir('01-regular-expressions'),
        'lessons',
        '0001-anchors.html',
      ),
      'utf8',
    )
    expect(lesson).toContain('.added-later { color: red; }')
  })

  it('should place the quiz stepper after the embedded stylesheet', async () => {
    await openWorkspace(ROOT, REQUEST)
    await writeStylesheet(ROOT, 'regular-expressions')
    await seedLesson(
      '01-regular-expressions',
      '0001-anchors.html',
      'Anchors',
      'Where a pattern starts and ends.',
      RADIO_QUIZ,
    )

    await generateNav(ROOT)

    const lesson = await readFile(
      join(
        workspaceDir('01-regular-expressions'),
        'lessons',
        '0001-anchors.html',
      ),
      'utf8',
    )

    const stepper = lesson.indexOf('@supports selector(:has(*))')
    expect(stepper).toBeGreaterThan(-1)
    expect(stepper).toBeGreaterThan(lesson.indexOf('--ink'))
    expect(stepper).toBeLessThan(lesson.indexOf('</style>'))
  })

  it('should carry the stepper on a lesson holding no quiz at all', async () => {
    await openWorkspace(ROOT, REQUEST)
    await writeStylesheet(ROOT, 'regular-expressions')
    await seedLesson(
      '01-regular-expressions',
      '0001-anchors.html',
      'Anchors',
      'Where a pattern starts and ends.',
    )

    await generateNav(ROOT)

    const lesson = await readFile(
      join(
        workspaceDir('01-regular-expressions'),
        'lessons',
        '0001-anchors.html',
      ),
      'utf8',
    )
    expect(lesson).toContain('@supports selector(:has(*))')
  })

  it('should give a radio quiz no script, since the stepper needs none', async () => {
    await openWorkspace(ROOT, REQUEST)
    await seedLesson(
      '01-regular-expressions',
      '0001-anchors.html',
      'Anchors',
      'Where a pattern starts and ends.',
      RADIO_QUIZ,
    )

    await generateNav(ROOT)

    const lesson = await readFile(
      join(
        workspaceDir('01-regular-expressions'),
        'lessons',
        '0001-anchors.html',
      ),
      'utf8',
    )
    expect(lesson).not.toContain('classList.add("show")')
  })

  it('should still script a lesson written against the button shape', async () => {
    await openWorkspace(ROOT, REQUEST)
    await seedLesson(
      '01-regular-expressions',
      '0001-anchors.html',
      'Anchors',
      'Where a pattern starts and ends.',
      BUTTON_QUIZ,
    )

    await generateNav(ROOT)

    const lesson = await readFile(
      join(
        workspaceDir('01-regular-expressions'),
        'lessons',
        '0001-anchors.html',
      ),
      'utf8',
    )
    expect(lesson).toContain('classList.add("show")')
  })

  it('should keep the stepper off a lesson written against the button shape', async () => {
    await openWorkspace(ROOT, REQUEST)
    await seedLesson(
      '01-regular-expressions',
      '0001-anchors.html',
      'Anchors',
      'Where a pattern starts and ends.',
      BUTTON_QUIZ,
    )

    await generateNav(ROOT)

    const lesson = await readFile(
      join(
        workspaceDir('01-regular-expressions'),
        'lessons',
        '0001-anchors.html',
      ),
      'utf8',
    )
    expect(lesson).not.toContain('@supports selector(:has(*))')
  })

  it('should be byte-identical on a second run against unchanged sources', async () => {
    await openWorkspace(ROOT, REQUEST)
    await writeStylesheet(ROOT, 'regular-expressions')
    await seedLesson(
      '01-regular-expressions',
      '0001-anchors.html',
      'Anchors',
      'Where a pattern starts and ends.',
    )
    await seedLesson(
      '01-regular-expressions',
      '0002-groups.html',
      'Capture groups',
      'A parenthesised part of a pattern whose match is kept.',
      RADIO_QUIZ,
    )

    await generateNav(ROOT)

    const paths = [
      join(teachDir(ROOT), 'index.html'),
      join(workspaceDir('01-regular-expressions'), 'index.html'),
      join(
        workspaceDir('01-regular-expressions'),
        'lessons',
        '0001-anchors.html',
      ),
      join(
        workspaceDir('01-regular-expressions'),
        'lessons',
        '0002-groups.html',
      ),
    ]
    const first = await Promise.all(paths.map((path) => readFile(path, 'utf8')))

    await generateNav(ROOT)

    const second = await Promise.all(
      paths.map((path) => readFile(path, 'utf8')),
    )

    expect(second).toEqual(first)
  })

  it('should write the previous and next links between two lessons', async () => {
    await openWorkspace(ROOT, REQUEST)
    await writeStylesheet(ROOT, 'regular-expressions')
    await seedLesson(
      '01-regular-expressions',
      '0001-anchors.html',
      'Anchors',
      'Where a pattern starts and ends.',
    )
    await seedLesson(
      '01-regular-expressions',
      '0002-groups.html',
      'Capture groups',
      'A parenthesised part of a pattern whose match is kept.',
    )

    await generateNav(ROOT)

    const first = await readFile(
      join(
        workspaceDir('01-regular-expressions'),
        'lessons',
        '0001-anchors.html',
      ),
      'utf8',
    )
    const second = await readFile(
      join(
        workspaceDir('01-regular-expressions'),
        'lessons',
        '0002-groups.html',
      ),
      'utf8',
    )

    expect(first).toContain('href="0002-groups.html"')
    expect(second).toContain('<span class="end">')
    expect(second).toContain('href="0001-anchors.html"')
    expect(second).toContain('Anchors')
  })
})
