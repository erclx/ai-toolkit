const GREEN = '\x1b[0;32m'
const RED = '\x1b[0;31m'
const WHITE = '\x1b[1;37m'
const GREY = '\x1b[0;90m'
const NC = '\x1b[0m'

export function intro(title: string): void {
  process.stderr.write(`${GREY}┌${NC}\n${GREY}│${NC} ${WHITE}${title}${NC}\n`)
}

export function outro(): void {
  process.stderr.write(`${GREY}└${NC}\n`)
}

export async function select<Value>(opts: {
  message: string
  options: { value: Value; label: string; hint?: string }[]
}): Promise<Value> {
  const { message, options } = opts
  const count = options.length
  let cursor = 0

  const render = (): void => {
    let out = `${GREY}│${NC}\n${GREEN}◆${NC} ${message}\n`
    for (let i = 0; i < count; i++) {
      const label = options[i].label
      const hint = options[i].hint ? ` ${GREY}${options[i].hint}${NC}` : ''
      if (i === cursor) {
        out += `${GREY}│${NC}  ${GREEN}❯ ${label}${NC}${hint}\n`
      } else {
        out += `${GREY}│${NC}    ${GREY}${label}${NC}${hint}\n`
      }
    }
    process.stderr.write(out)
  }

  const clear = (): void => {
    process.stderr.write(`\x1b[${count + 2}A\x1b[J`)
  }

  return new Promise<Value>((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error('select requires a TTY'))
      return
    }

    const wasRaw = process.stdin.isRaw
    process.stdin.setRawMode(true)
    process.stdin.resume()

    render()

    const onData = (data: Buffer): void => {
      const key = data.toString()

      if (key === '\x1b[A' || key === 'k') {
        cursor = (cursor - 1 + count) % count
        clear()
        render()
      } else if (key === '\x1b[B' || key === 'j') {
        cursor = (cursor + 1) % count
        clear()
        render()
      } else if (key === '\r' || key === '\n') {
        cleanup()
        clear()
        process.stderr.write(
          `${GREY}│${NC}\n${GREY}◇${NC} ${message} ${WHITE}${options[cursor].label}${NC}\n`,
        )
        resolve(options[cursor].value)
      } else if (key === '\x1b' || key === 'q' || key === '\x03') {
        cleanup()
        clear()
        process.stderr.write(
          `${GREY}│${NC}\n${GREY}◇${NC} ${message} ${RED}Cancelled${NC}\n${GREY}└${NC}\n`,
        )
        process.exit(1)
      }
    }

    const cleanup = (): void => {
      process.stdin.removeListener('data', onData)
      process.stdin.setRawMode(wasRaw ?? false)
      process.stdin.pause()
    }

    process.stdin.on('data', onData)
  })
}

export async function confirm(opts: {
  message: string
  active?: string
  inactive?: string
}): Promise<boolean> {
  const active = opts.active ?? 'Yes'
  const inactive = opts.inactive ?? 'No'

  const result = await select({
    message: opts.message,
    options: [
      { value: true, label: active },
      { value: false, label: inactive },
    ],
  })

  return result
}
