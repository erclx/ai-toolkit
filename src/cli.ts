#!/usr/bin/env bun

import { Command } from 'commander'
import { register as init } from '@/commands/init'
import { register as sandbox } from '@/commands/sandbox'
import { register as sync } from '@/commands/sync'
import { register as gov } from '@/commands/gov'
import { register as standards } from '@/commands/standards'
import { register as snippets } from '@/commands/snippets'
import { register as prompts } from '@/commands/prompts'
import { register as tooling } from '@/commands/tooling'
import { register as claude } from '@/commands/claude'
import { register as wiki } from '@/commands/wiki'
import { register as antigravity } from '@/commands/antigravity'

const GREY = '\x1b[0;90m'
const WHITE = '\x1b[1;37m'
const NC = '\x1b[0m'

function showHelp(): void {
  const lines = [
    `${GREY}┌${NC}`,
    `${GREY}├${NC} ${WHITE}Usage:${NC} aitk [command]`,
    `${GREY}│${NC}`,
    `${GREY}│${NC}  ${WHITE}Commands:${NC}`,
    `${GREY}│${NC}    init [path]        ${GREY}# Bootstrap a project with toolkit domains${NC}`,
    `${GREY}│${NC}    sync [path]        ${GREY}# Sync all installed domains in a project${NC}`,
    `${GREY}│${NC}    sandbox [cat:cmd]  ${GREY}# Provision and run sandbox scenarios${NC}`,
    `${GREY}│${NC}    gov [command]      ${GREY}# Governance commands (install, sync)${NC}`,
    `${GREY}│${NC}    standards [cmd]    ${GREY}# Standards commands (install, sync)${NC}`,
    `${GREY}│${NC}    snippets [cmd]     ${GREY}# Snippets commands (install, sync)${NC}`,
    `${GREY}│${NC}    prompts [cmd]      ${GREY}# Prompts commands (install, sync)${NC}`,
    `${GREY}│${NC}    tooling [cmd]      ${GREY}# Manage tooling stacks (sync, ref, create)${NC}`,
    `${GREY}│${NC}    claude [cmd]       ${GREY}# Claude workflow (init, sync, prompt)${NC}`,
    `${GREY}│${NC}    wiki [cmd]         ${GREY}# Wiki commands (init)${NC}`,
    `${GREY}│${NC}    antigravity [cmd]  ${GREY}# Antigravity workflows (install, sync)${NC}`,
    `${GREY}│${NC}`,
    `${GREY}│${NC}  ${WHITE}Sandbox:${NC}`,
    `${GREY}│${NC}    aitk sandbox             ${GREY}# Interactive scenario picker${NC}`,
    `${GREY}│${NC}    aitk sandbox git:commit  ${GREY}# Run specific scenario${NC}`,
    `${GREY}│${NC}    aitk sandbox reset       ${GREY}# Reset sandbox to baseline${NC}`,
    `${GREY}│${NC}    aitk sandbox clean       ${GREY}# Wipe the sandbox${NC}`,
    `${GREY}│${NC}`,
    `${GREY}│${NC}  ${WHITE}Examples:${NC}`,
    `${GREY}│${NC}    aitk sync ../my-app`,
    `${GREY}│${NC}    aitk sandbox git:commit`,
    `${GREY}│${NC}    aitk gov install react`,
    `${GREY}│${NC}    aitk gov sync ../my-app`,
    `${GREY}│${NC}    aitk standards sync ../my-app`,
    `${GREY}│${NC}    aitk snippets install base ../my-app`,
    `${GREY}│${NC}    aitk snippets sync ../my-app`,
    `${GREY}│${NC}    aitk prompts install scripting ../my-app`,
    `${GREY}│${NC}    aitk prompts sync ../my-app`,
    `${GREY}│${NC}    aitk init ../my-app`,
    `${GREY}│${NC}    aitk tooling sync base`,
    `${GREY}│${NC}    aitk tooling create`,
    `${GREY}│${NC}    aitk claude prompt`,
    `${GREY}│${NC}    aitk antigravity install git ../my-app`,
    `${GREY}│${NC}    aitk antigravity sync ../my-app`,
    `${GREY}└${NC}`,
  ]
  console.log(lines.join('\n'))
}

const program = new Command()
program
  .name('aitk')
  .version('0.1.0')
  .enablePositionalOptions()
  .helpOption(false)
program.action(() => showHelp())
program.on('option:help', () => {
  showHelp()
  process.exit(0)
})
program.option('-h, --help', 'Show help')

init(program)
sandbox(program)
sync(program)
gov(program)
standards(program)
snippets(program)
prompts(program)
tooling(program)
claude(program)
wiki(program)
antigravity(program)

program.parse()
