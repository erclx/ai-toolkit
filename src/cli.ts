#!/usr/bin/env bun

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Command } from 'commander'
import { register as init } from '@/commands/init'
import { register as sandbox } from '@/commands/sandbox'
import { register as sync } from '@/commands/sync'
import { register as gov } from '@/commands/gov'
import { register as standards } from '@/commands/standards'
import { register as snippets } from '@/commands/snippets'
import { register as tooling } from '@/commands/tooling'
import { register as claude } from '@/commands/claude'
import { register as wiki } from '@/commands/wiki'
import { register as indexes } from '@/commands/indexes'
import { register as docs } from '@/commands/docs'
import { register as design } from '@/commands/design'
import { register as slides } from '@/commands/slides'
import { register as capture } from '@/commands/capture'
import { register as feedback } from '@/commands/feedback'
import { register as transcripts } from '@/commands/transcripts'
import { register as tasks } from '@/commands/tasks'
import { register as intake } from '@/commands/intake'
import { register as teach } from '@/commands/teach'
import { register as comments } from '@/commands/comments'
import { register as context } from '@/commands/context'
import { register as markdown } from '@/commands/markdown'
import { register as records } from '@/commands/records'
import { register as sessions } from '@/commands/sessions'
import { PROJECT_ROOT } from '@/project-root'

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
    `${GREY}│${NC}    standards [cmd]    ${GREY}# Standards commands (install, sync, list, <name>)${NC}`,
    `${GREY}│${NC}    snippets [cmd]     ${GREY}# Snippets commands (install, sync)${NC}`,
    `${GREY}│${NC}    tooling [cmd]      ${GREY}# Manage tooling stacks (sync, ref, create)${NC}`,
    `${GREY}│${NC}    claude [cmd]       ${GREY}# Claude workflow (init, sync, setup)${NC}`,
    `${GREY}│${NC}    wiki [cmd]         ${GREY}# Wiki commands (init)${NC}`,
    `${GREY}│${NC}    indexes [cmd]      ${GREY}# Regenerate index.md files (regen)${NC}`,
    `${GREY}│${NC}    docs [cmd|topic]   ${GREY}# Emit toolkit reference docs (list, <topic>)${NC}`,
    `${GREY}│${NC}    design [cmd]       ${GREY}# Design system commands (render)${NC}`,
    `${GREY}│${NC}    slides [cmd]       ${GREY}# Slide deck commands (render, list)${NC}`,
    `${GREY}│${NC}    capture [source]   ${GREY}# Render HTML capture sources to PNG${NC}`,
    `${GREY}│${NC}    feedback           ${GREY}# Write toolkit feedback from stdin to .claude/review/${NC}`,
    `${GREY}│${NC}    transcripts <url>  ${GREY}# Fetch a YouTube transcript with metadata frontmatter${NC}`,
    `${GREY}│${NC}    tasks [cmd]        ${GREY}# Task board commands (archive)${NC}`,
    `${GREY}│${NC}    intake [cmd]       ${GREY}# Intake folders under .claude/intake/ (list, answer)${NC}`,
    `${GREY}│${NC}    teach [cmd]        ${GREY}# Learning workspaces under .claude/teach/ (list, open, resource, glossary)${NC}`,
    `${GREY}│${NC}    comments [cmd]     ${GREY}# Measure comment density and trend (scan)${NC}`,
    `${GREY}│${NC}    context [cmd]      ${GREY}# Report context folder health (audit)${NC}`,
    `${GREY}│${NC}    markdown [cmd]     ${GREY}# Report markdown against the attribute standards (audit)${NC}`,
    `${GREY}│${NC}    records [cmd]      ${GREY}# Session records under .claude/ (validate, push, pull)${NC}`,
    `${GREY}│${NC}    sessions [cmd]     ${GREY}# Resolve live sessions to worktree and branch (list)${NC}`,
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
    `${GREY}│${NC}    aitk init ../my-app`,
    `${GREY}│${NC}    aitk tooling sync base`,
    `${GREY}│${NC}    aitk tooling create`,
    `${GREY}│${NC}    aitk claude init`,
    `${GREY}│${NC}    aitk indexes regen`,
    `${GREY}│${NC}    aitk indexes regen --dry-run --json`,
    `${GREY}│${NC}    aitk docs list --json`,
    `${GREY}│${NC}    aitk docs agents`,
    `${GREY}│${NC}    aitk design render`,
    `${GREY}│${NC}    aitk slides render`,
    `${GREY}│${NC}    aitk slides list --json`,
    `${GREY}│${NC}    aitk capture assets/install.html`,
    `${GREY}│${NC}    pbpaste | aitk feedback`,
    `${GREY}│${NC}    aitk transcripts https://youtu.be/VIDEO_ID`,
    `${GREY}│${NC}    aitk tasks archive --pull-request 673 --json`,
    `${GREY}│${NC}    aitk intake list toolkit-overview --unread --json`,
    `${GREY}│${NC}    aitk teach list --json`,
    `${GREY}│${NC}    aitk comments scan src --json`,
    `${GREY}│${NC}    aitk context audit --json`,
    `${GREY}│${NC}    aitk markdown audit .claude/rules --json`,
    `${GREY}│${NC}    aitk records validate plans`,
    `${GREY}│${NC}    aitk records push --json`,
    `${GREY}│${NC}    aitk sessions list --json`,
    `${GREY}└${NC}`,
  ]
  console.log(lines.join('\n'))
}

/**
 * Read at runtime rather than inlined, because a literal here is a second place
 * the version lives and it stopped tracking `package.json` at `0.1.0`. The
 * release tool writes one file and this follows it. `package.json` ships in
 * every npm tarball regardless of the `files` list, so the read resolves from a
 * registry install as well as from a clone.
 */
function readVersion(): string {
  try {
    const raw = readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf8')
    return (JSON.parse(raw) as { version?: string }).version ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

const program = new Command()
program
  .name('aitk')
  .version(readVersion())
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
tooling(program)
claude(program)
wiki(program)
indexes(program)
docs(program)
design(program)
slides(program)
capture(program)
feedback(program)
transcripts(program)
tasks(program)
intake(program)
teach(program)
comments(program)
context(program)
markdown(program)
records(program)
sessions(program)

program.parse()
