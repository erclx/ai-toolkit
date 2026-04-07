import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Command } from 'commander'
import { PROJECT_ROOT, execScript } from '@/exec'
import { intro, select } from '@/ui'

const SANDBOX_DIR = join(PROJECT_ROOT, 'scripts', 'sandbox')

function getCategories(): string[] {
  return readdirSync(SANDBOX_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
}

function getCommands(category: string): string[] {
  return readdirSync(join(SANDBOX_DIR, category), { withFileTypes: true })
    .filter((f) => f.isFile() && f.name.endsWith('.sh'))
    .map((f) => f.name.replace(/\.sh$/, ''))
    .sort()
}

async function interactivePicker(): Promise<string> {
  intro('aitk sandbox')

  const categories = getCategories()
  const category = await select({
    message: 'Select category:',
    options: categories.map((c) => ({ value: c, label: c })),
  })

  const commands = getCommands(category)
  const command = await select({
    message: 'Select command:',
    options: commands.map((c) => ({ value: c, label: c })),
  })

  return `${category}:${command}`
}

export function register(program: Command): void {
  program
    .command('sandbox')
    .description('Provision and run sandbox scenarios')
    .allowUnknownOption()
    .allowExcessArguments(true)
    .passThroughOptions()
    .action(async (_opts: unknown, cmd: Command) => {
      const args = cmd.args

      if (args.length === 0) {
        const resolved = await interactivePicker()
        await execScript('manage-sandbox.sh', ['--no-header', resolved])
      } else {
        await execScript('manage-sandbox.sh', args)
      }
    })
}
