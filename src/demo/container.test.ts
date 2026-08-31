import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execa } from 'execa'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { convertToMp4 } from '@/demo/container'

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
    },
  )
})
