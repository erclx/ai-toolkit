import { join, parse } from 'node:path'
import { execa } from 'execa'

/**
 * A post-step on the file `@/demo/drive` already wrote. It touches neither
 * the compiler nor the driving code, which is why deferring it out of the
 * feature that shipped first cost no rework.
 */

const CONVERTER_BIN = 'ffmpeg'
export const INSTALL_CONVERTER = 'ffmpeg (see https://ffmpeg.org/download.html)'

export type ContainerResult =
  | { status: 'converted'; mp4Path: string }
  | { status: 'skipped'; reason: 'converter-missing' }
  | { status: 'failed'; reason: string }

/**
 * Writes mp4 beside the webm rather than instead of it, since both stated use
 * cases are a `<video>` tag on a page the operator controls, where webm
 * already plays, and the social platform case is what mp4 is for.
 *
 * A missing binary is reported as skipped rather than failed. The recording
 * already succeeded, and failing the run over an optional step would discard
 * a good artifact.
 */
export async function convertToMp4(
  webmPath: string,
  bin: string = CONVERTER_BIN,
): Promise<ContainerResult> {
  const { dir, name } = parse(webmPath)
  const mp4Path = join(dir, `${name}.mp4`)

  const result = await execa(
    bin,
    [
      '-y',
      '-i',
      webmPath,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-movflags',
      '+faststart',
      mp4Path,
    ],
    { reject: false },
  )

  if (result.failed && result.code === 'ENOENT') {
    return { status: 'skipped', reason: 'converter-missing' }
  }
  if (result.exitCode !== 0) {
    return {
      status: 'failed',
      reason: result.stderr?.trim() || `ffmpeg exited ${result.exitCode}`,
    }
  }
  return { status: 'converted', mp4Path }
}
