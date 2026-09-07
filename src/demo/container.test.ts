import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execa } from 'execa'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  convertToGif,
  convertToMp4,
  extractFrames,
  frameIndex,
} from '@/demo/container'

async function ffmpegAvailable(): Promise<boolean> {
  const result = await execa('ffmpeg', ['-version'], { reject: false })
  return result.exitCode === 0
}

const hasFfmpeg = await ffmpegAvailable()

describe('convertToMp4', () => {
  it('should report the converter missing without failing the run', async () => {
    const result = await convertToMp4(
      '/nonexistent/clip.webm',
      'definitely-not-a-real-ffmpeg-binary',
    )

    expect(result).toEqual({ status: 'skipped', reason: 'converter-missing' })
  })

  describe.skipIf(!hasFfmpeg)(
    'against a recording ffmpeg already wrote',
    () => {
      let root: string
      let webmPath: string

      beforeAll(async () => {
        root = mkdtempSync(join(tmpdir(), 'canon-demo-container-'))
        webmPath = join(root, 'clip.webm')
        await execa('ffmpeg', [
          '-y',
          '-f',
          'lavfi',
          '-i',
          'testsrc=size=32x32:rate=1:duration=1',
          '-c:v',
          'libvpx',
          webmPath,
        ])
      })

      afterAll(() => {
        rmSync(root, { recursive: true, force: true })
      })

      it('should write an mp4 beside the webm rather than replacing it', async () => {
        const result = await convertToMp4(webmPath)

        expect(result).toMatchObject({ status: 'converted' })
        if (result.status !== 'converted') return
        expect(existsSync(webmPath)).toBe(true)
        expect(existsSync(result.mp4Path)).toBe(true)
        expect(statSync(result.mp4Path).size).toBeGreaterThan(0)
      })

      it('should write a gif beside the webm rather than replacing it', async () => {
        const result = await convertToGif(webmPath)

        expect(result).toMatchObject({ status: 'converted' })
        if (result.status !== 'converted') return
        expect(existsSync(webmPath)).toBe(true)
        expect(existsSync(result.gifPath)).toBe(true)
        expect(statSync(result.gifPath).size).toBeGreaterThan(0)
      })

      it('should write numbered png frames beside the webm', async () => {
        const result = await extractFrames(webmPath)

        expect(result).toMatchObject({ status: 'extracted' })
        if (result.status !== 'extracted') return
        expect(result.framePaths.length).toBeGreaterThan(0)
        for (const framePath of result.framePaths) {
          expect(existsSync(framePath)).toBe(true)
          expect(statSync(framePath).size).toBeGreaterThan(0)
        }
      })

      it('should not return a prior extraction leftover past a shorter one at the same path', async () => {
        const first = await extractFrames(webmPath, undefined, { fps: 3 })
        expect(first).toMatchObject({ status: 'extracted' })
        if (first.status !== 'extracted') return
        expect(first.framePaths.length).toBeGreaterThan(1)

        const second = await extractFrames(webmPath, undefined, { fps: 1 })
        expect(second).toMatchObject({ status: 'extracted' })
        if (second.status !== 'extracted') return
        expect(second.framePaths.length).toBeLessThan(first.framePaths.length)
        for (const stale of first.framePaths.slice(second.framePaths.length)) {
          expect(existsSync(stale)).toBe(false)
        }
      })
    },
  )
})

describe('convertToGif', () => {
  it('should report the converter missing without failing the run', async () => {
    const result = await convertToGif(
      '/nonexistent/clip.webm',
      'definitely-not-a-real-ffmpeg-binary',
    )

    expect(result).toEqual({ status: 'skipped', reason: 'converter-missing' })
  })
})

describe('frameIndex', () => {
  it('should sort past the three-character padding ffmpeg writes', () => {
    const names = [
      'clip-frame-1000.png',
      'clip-frame-001.png',
      'clip-frame-999.png',
    ]

    expect([...names].sort((a, b) => frameIndex(a) - frameIndex(b))).toEqual([
      'clip-frame-001.png',
      'clip-frame-999.png',
      'clip-frame-1000.png',
    ])
  })
})

describe('extractFrames', () => {
  it('should report the converter missing without failing the run', async () => {
    const result = await extractFrames(
      '/nonexistent/clip.webm',
      undefined,
      {},
      'definitely-not-a-real-ffmpeg-binary',
    )

    expect(result).toEqual({ status: 'skipped', reason: 'converter-missing' })
  })
})
