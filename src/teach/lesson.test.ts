import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { orderQuiz, planLesson } from '@/teach/lesson'
import { openWorkspace, teachDir } from '@/teach/workspace'

let ROOT: string

const REQUEST = {
  topic: 'regular-expressions',
  subject: 'Reading and writing regular expressions',
  startingPoint: 'Comfortable with the shell, has never written a group',
  success: [
    'Write a pattern matching a date',
    'Explain what a backreference does',
  ],
  outOfScope: [],
  date: '2026-08-19',
}

const LESSON = { slug: 'capture-groups', questions: 1, options: 4 }

function workspaceDir(slug: string): string {
  return join(teachDir(ROOT), slug)
}

/** A generator cycling one fixed sequence, so an order can be asserted. */
function cycling(values: readonly number[]): () => number {
  let index = 0

  return () => values[index++ % values.length]
}

async function seedLessons(slug: string, files: readonly string[]) {
  const dir = join(workspaceDir(slug), 'lessons')
  mkdirSync(dir, { recursive: true })

  for (const file of files)
    await writeFile(join(dir, file), '<article></article>')
}

beforeEach(async () => {
  ROOT = mkdtempSync(join(tmpdir(), 'canon-lesson-'))
  await openWorkspace(ROOT, REQUEST)
})

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true })
})

describe('orderQuiz', () => {
  it('should report one order per question', () => {
    expect(orderQuiz(3, 4, cycling([0]))).toHaveLength(3)
  })

  it('should present every authored option exactly once', () => {
    const [order] = orderQuiz(1, 5, cycling([0.1, 0.9, 0.5, 0.3]))

    expect([...order.order].sort()).toEqual([0, 1, 2, 3, 4])
  })

  it('should report the position the correct answer landed in', () => {
    const [order] = orderQuiz(1, 4, cycling([0.99, 0.99, 0.99]))

    expect(order.answer).toBe(order.order.indexOf(0) + 1)
  })

  it('should number the questions from one', () => {
    expect(
      orderQuiz(2, 2, cycling([0])).map((entry) => entry.question),
    ).toEqual([1, 2])
  })

  it('should put the correct answer in every position across many draws', () => {
    const positions = new Set(orderQuiz(200, 4).map((entry) => entry.answer))

    expect([...positions].sort()).toEqual([1, 2, 3, 4])
  })
})

describe('planLesson', () => {
  it('should number the first lesson in a workspace 0001', async () => {
    const outcome = await planLesson(ROOT, 'regular-expressions', LESSON)

    expect(outcome).toMatchObject({
      ok: true,
      lesson: join(
        '.claude',
        'teach',
        '01-regular-expressions',
        'lessons',
        '0001-capture-groups.html',
      ),
    })
  })

  it('should number past the highest lesson already there', async () => {
    await seedLessons('01-regular-expressions', [
      '0001-reading-patterns.html',
      '0004-quantifiers.html',
    ])

    const outcome = await planLesson(ROOT, 'regular-expressions', LESSON)

    expect(outcome).toMatchObject({
      lesson: expect.stringContaining('0005-capture-groups.html'),
    })
  })

  it('should number past a lesson whose name carries no ordinal', async () => {
    await seedLessons('01-regular-expressions', ['scratch.html'])

    const outcome = await planLesson(ROOT, 'regular-expressions', LESSON)

    expect(outcome).toMatchObject({
      lesson: expect.stringContaining('0001-capture-groups.html'),
    })
  })

  it('should report the stylesheet as absent before the first lesson writes it', async () => {
    const outcome = await planLesson(ROOT, 'regular-expressions', LESSON)

    expect(outcome).toMatchObject({
      stylesheetExists: false,
      stylesheet: join(
        '.claude',
        'teach',
        '01-regular-expressions',
        'assets',
        'course.css',
      ),
      stylesheetHref: '../assets/course.css',
    })
  })

  it('should report the stylesheet as present once it is on disk', async () => {
    const assets = join(workspaceDir('01-regular-expressions'), 'assets')
    mkdirSync(assets, { recursive: true })
    await writeFile(join(assets, 'course.css'), 'body { margin: 0; }')

    expect(await planLesson(ROOT, 'regular-expressions', LESSON)).toMatchObject(
      { stylesheetExists: true },
    )
  })

  it("should report the mission's success lines as the exit criteria", async () => {
    const outcome = await planLesson(ROOT, 'regular-expressions', LESSON)

    expect(outcome).toMatchObject({
      success: [
        'Write a pattern matching a date',
        'Explain what a backreference does',
      ],
    })
  })

  it('should refuse a slug that is not kebab-case', async () => {
    const outcome = await planLesson(ROOT, 'regular-expressions', {
      ...LESSON,
      slug: 'Capture Groups',
    })

    expect(outcome).toMatchObject({ ok: false, reason: 'bad-input' })
  })

  it('should refuse a quiz with no questions', async () => {
    const outcome = await planLesson(ROOT, 'regular-expressions', {
      ...LESSON,
      questions: 0,
    })

    expect(outcome).toMatchObject({ ok: false, reason: 'bad-input' })
  })

  it('should refuse a question carrying one option', async () => {
    const outcome = await planLesson(ROOT, 'regular-expressions', {
      ...LESSON,
      options: 1,
    })

    expect(outcome).toMatchObject({ ok: false, reason: 'bad-input' })
  })

  it('should refuse a topic no workspace covers', async () => {
    const outcome = await planLesson(ROOT, 'parsing', LESSON)

    expect(outcome).toMatchObject({ ok: false, reason: 'no-workspace' })
  })
})
