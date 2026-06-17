import { existsSync } from 'node:fs'
import { execa } from 'execa'

export async function openDeck(path: string): Promise<boolean> {
  const windowsPath = await execa('wslpath', ['-w', path], { reject: false })
  if (windowsPath.exitCode === 0) {
    const cwd = existsSync('/mnt/c') ? '/mnt/c' : undefined
    const result = await execa(
      'cmd.exe',
      ['/c', 'start', '', windowsPath.stdout.trim()],
      { cwd, reject: false },
    )
    return result.exitCode === 0
  }
  const opener = process.platform === 'darwin' ? 'open' : 'xdg-open'
  const result = await execa(opener, [path], { reject: false })
  return result.exitCode === 0
}
