import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { connect } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_PORT,
  resolveWithin,
  SERVE_HOST,
  type ServeStarted,
  startServer,
} from '@/serve/static'

let ROOT: string
const running: ServeStarted[] = []

function seed(relativePath: string, body: string): string {
  const full = join(ROOT, relativePath)
  mkdirSync(join(full, '..'), { recursive: true })
  writeFileSync(full, body)
  return full
}

/**
 * Sends a request line verbatim and reports the status. `fetch` resolves `..`
 * and decodes `%2e%2e` before the request leaves, so a traversal sent through
 * it arrives already collapsed and tests the client rather than the server.
 */
function rawRequest(port: number, path: string): Promise<number> {
  return new Promise((settle, fail) => {
    const socket = connect(port, SERVE_HOST, () => {
      socket.write(
        `GET ${path} HTTP/1.1\r\nHost: ${SERVE_HOST}\r\nConnection: close\r\n\r\n`,
      )
    })
    let received = ''
    socket.on('data', (chunk) => {
      received += chunk.toString()
    })
    socket.on('error', fail)
    socket.on('close', () => {
      const status = received.match(/^HTTP\/1\.[01] (\d{3})/)
      if (!status) {
        fail(new Error(`no status line in response: ${received.slice(0, 80)}`))
        return
      }
      settle(Number(status[1]))
    })
  })
}

/** Starts a server and registers it for teardown, so no test leaks a port. */
function start(
  dir: string,
  options?: { port?: number; entry?: string },
): ServeStarted {
  const outcome = startServer(dir, options)
  if (!outcome.ok)
    throw new Error(`expected a started server, got ${outcome.reason}`)
  running.push(outcome)
  return outcome
}

beforeEach(() => {
  ROOT = mkdtempSync(join(tmpdir(), 'aitk-serve-'))
})

afterEach(async () => {
  await Promise.all(running.splice(0).map((server) => server.stop()))
  rmSync(ROOT, { recursive: true, force: true })
})

describe('resolveWithin', () => {
  it('should resolve a path inside the root', () => {
    const resolved = resolveWithin('/srv/site', '/assets/course.css')

    expect(resolved).toBe('/srv/site/assets/course.css')
  })

  it('should refuse a path that climbs out of the root', () => {
    const resolved = resolveWithin('/srv/site', '/../../etc/passwd')

    expect(resolved).toBeUndefined()
  })

  it('should refuse a traversal hidden by percent encoding', () => {
    const resolved = resolveWithin('/srv/site', '/%2e%2e/%2e%2e/etc/passwd')

    expect(resolved).toBeUndefined()
  })

  it('should refuse a path carrying a NUL byte', () => {
    const resolved = resolveWithin('/srv/site', '/index.html%00.png')

    expect(resolved).toBeUndefined()
  })

  it('should refuse a sibling directory sharing the root prefix', () => {
    const resolved = resolveWithin('/srv/site', '/../site-private/secret.txt')

    expect(resolved).toBeUndefined()
  })
})

describe('startServer', () => {
  it('should refuse a directory that does not exist', () => {
    const outcome = startServer(join(ROOT, 'absent'))

    expect(outcome).toMatchObject({ ok: false, reason: 'no-root' })
  })

  it('should refuse a path that is a file', () => {
    seed('page.html', '<h1>page</h1>')

    const outcome = startServer(join(ROOT, 'page.html'))

    expect(outcome).toMatchObject({ ok: false, reason: 'not-a-directory' })
  })

  it('should report a url carrying the entry page', () => {
    seed('index.html', '<h1>root</h1>')

    const server = start(ROOT, { port: 0 })

    expect(server.url).toBe(`http://${SERVE_HOST}:${server.port}/index.html`)
  })

  it('should report an absent entry page without refusing', () => {
    seed('other.html', '<h1>other</h1>')

    const server = start(ROOT, { port: 0 })

    expect(server.entryExists).toBe(false)
  })

  it('should serve a file from the root', async () => {
    seed('index.html', '<h1>root</h1>')
    const server = start(ROOT, { port: 0 })

    const body = await fetch(server.url).then((r) => r.text())

    expect(body).toBe('<h1>root</h1>')
  })

  it('should serve a nested asset', async () => {
    seed('assets/course.css', 'body { color: red }')
    const server = start(ROOT, { port: 0 })

    const body = await fetch(
      `http://${SERVE_HOST}:${server.port}/assets/course.css`,
    ).then((r) => r.text())

    expect(body).toBe('body { color: red }')
  })

  it('should type a stylesheet so a browser applies it', async () => {
    seed('assets/course.css', 'body { color: red }')
    const server = start(ROOT, { port: 0 })

    const response = await fetch(
      `http://${SERVE_HOST}:${server.port}/assets/course.css`,
    )

    expect(response.headers.get('content-type')).toBe('text/css; charset=utf-8')
  })

  it('should serve markdown as text so a browser shows it rather than saving it', async () => {
    seed('reference/page.md', '# Heading')
    const server = start(ROOT, { port: 0 })

    const response = await fetch(
      `http://${SERVE_HOST}:${server.port}/reference/page.md`,
    )

    expect(response.headers.get('content-type')).toBe(
      'text/plain; charset=utf-8',
    )
  })

  it('should forbid caching so an edited stylesheet is not served stale', async () => {
    seed('index.html', '<h1>root</h1>')
    const server = start(ROOT, { port: 0 })

    const response = await fetch(server.url)

    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('should serve the index of a directory request', async () => {
    seed('workspace/index.html', '<h1>workspace</h1>')
    const server = start(ROOT, { port: 0 })

    const body = await fetch(
      `http://${SERVE_HOST}:${server.port}/workspace/`,
    ).then((r) => r.text())

    expect(body).toBe('<h1>workspace</h1>')
  })

  it('should answer 404 for a file that is not there', async () => {
    seed('index.html', '<h1>root</h1>')
    const server = start(ROOT, { port: 0 })

    const response = await fetch(
      `http://${SERVE_HOST}:${server.port}/absent.html`,
    )

    expect(response.status).toBe(404)
  })

  /**
   * An encoded separator rather than an encoded dot. The URL parser resolves
   * `..` and `%2e%2e` into the path before a handler sees it, so neither
   * reaches the containment test and both answer 404 for want of a file. An
   * encoded slash survives parsing intact and decodes into a traversal inside
   * the handler, which is the one shape that reaches the guard.
   */
  it('should answer 403 for a traversal built from an encoded separator', async () => {
    seed('index.html', '<h1>root</h1>')
    const server = start(ROOT, { port: 0 })

    /* Assembled rather than written whole, so the encoded separator does not
       run into the next word and read as a misspelling to the spell check. */
    const climb = `/..${'%2f'}..${'%2f'}escape.txt`

    const status = await rawRequest(server.port, climb)

    expect(status).toBe(403)
  })

  it('should answer 403 for a path carrying a NUL byte', async () => {
    seed('index.html', '<h1>root</h1>')
    const server = start(ROOT, { port: 0 })

    const status = await rawRequest(server.port, '/index.html%00.png')

    expect(status).toBe(403)
  })

  it('should bind the loopback interface rather than every address', () => {
    seed('index.html', '<h1>root</h1>')

    const server = start(ROOT, { port: 0 })

    expect(server.host).toBe('127.0.0.1')
  })

  it('should walk past a port already in use', () => {
    seed('index.html', '<h1>root</h1>')
    const first = start(ROOT, { port: DEFAULT_PORT })

    const second = start(ROOT, { port: DEFAULT_PORT })

    expect(second.port).toBe(first.port + 1)
  })
})
