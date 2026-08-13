import { join } from 'node:path'
import { execa } from 'execa'
import { PROJECT_ROOT } from '@/project-root'

export async function execScript(
  script: string,
  args: string[],
): Promise<void> {
  const scriptPath = join(PROJECT_ROOT, 'scripts', script)
  const result = await execa(scriptPath, args, {
    stdio: 'inherit',
    env: { ...process.env, PROJECT_ROOT },
    reject: false,
  })
  process.exit(result.exitCode ?? 1)
}
