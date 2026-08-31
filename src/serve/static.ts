import { existsSync, statSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'

/**
 * The loopback interface, never a wildcard bind. A preview serves whatever
 * directory it is pointed at, and the folders this exists for are the
 * gitignored record trees, so reaching the network is the one thing it must
 * not do.
 */
export const SERVE_HOST = '127.0.0.1'

/** Tried first, then the next ports in order, so a second preview still opens. */
export const DEFAULT_PORT = 8787

/** How far past the requested port to look before refusing. */
const PORT_ATTEMPTS = 20

const DEFAULT_ENTRY = 'index.html'

/**
 * Extensions a browser has to be told about. Anything absent is served as an
 * octet stream, which downloads rather than renders, and that is the safe
 * direction for a type this map does not claim to know.
 */
const CONTENT_TYPES: Readonly<Record<string, string>> = {
  css: 'text/css; charset=utf-8',
  gif: 'image/gif',
  htm: 'text/html; charset=utf-8',
  html: 'text/html; charset=utf-8',
  ico: 'image/x-icon',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  js: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  /**
   * Plain text rather than `text/markdown`, which a browser offers to save
   * instead of showing. A reader following a link to a source page wants to
   * read it, and the rendered sibling is a separate file.
   */
  md: 'text/plain; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  pdf: 'application/pdf',
  png: 'image/png',
  svg: 'image/svg+xml',
  txt: 'text/plain; charset=utf-8',
  webp: 'image/webp',
  woff: 'font/woff',
  woff2: 'font/woff2',
}

export type ServeRefusal =
  | 'no-root'
  | 'not-a-directory'
  | 'no-port'
  | 'no-entry'

export interface ServeRefused {
  readonly ok: false
  readonly reason: ServeRefusal
  readonly detail: string
}

export interface ServeStarted {
  readonly ok: true
  /** Absolute, so a report names the directory rather than the caller's cwd. */
  readonly root: string
  readonly host: string
  readonly port: number
  /** The entry page relative to the root, as the URL spells it. */
  readonly entry: string
  /** What a reader clicks. Complete, including the entry page. */
  readonly url: string
  /** Whether the entry page exists. A missing one is reported, never fatal. */
  readonly entryExists: boolean
  readonly stop: () => Promise<void>
}

export type ServeOutcome = ServeStarted | ServeRefused

export interface ServeOptions {
  readonly port?: number
  readonly entry?: string
}

function refuse(reason: ServeRefusal, detail: string): ServeRefused {
  return { ok: false, reason, detail }
}

function contentType(path: string): string {
  const dot = path.lastIndexOf('.')
  if (dot === -1) return 'application/octet-stream'
  const ext = path.slice(dot + 1).toLowerCase()
  return CONTENT_TYPES[ext] ?? 'application/octet-stream'
}

/**
 * Resolves a request path inside the root, or returns undefined when it escapes.
 * The containment test compares resolved absolute paths rather than inspecting
 * the request for `..`, because an encoded traversal survives a textual scan and
 * does not survive resolution.
 */
export function resolveWithin(
  root: string,
  requestPath: string,
): string | undefined {
  let decoded: string
  try {
    decoded = decodeURIComponent(requestPath)
  } catch {
    return undefined
  }
  /**
   * A NUL truncates the path at the filesystem layer, so a request carrying one
   * asks for a different file than the one the containment test read.
   */
  if (decoded.includes('\0')) return undefined

  const relativePath = decoded.replace(/^\/+/, '')
  const target = resolve(root, relativePath)
  if (target !== root && !target.startsWith(root + sep)) return undefined
  return target
}

/**
 * Picks a listening port, starting at the requested one and walking forward.
 * A busy port is the ordinary case rather than a failure, since a preview of
 * one workspace is routinely open while another is started.
 */
function listen(
  root: string,
  first: number,
): { server: ReturnType<typeof Bun.serve>; port: number } | undefined {
  for (let port = first; port < first + PORT_ATTEMPTS; port++) {
    try {
      const server = Bun.serve({
        hostname: SERVE_HOST,
        port,
        fetch: (request) => respond(root, request),
      })
      /**
       * The bound port rather than the requested one. Port 0 asks the OS to
       * choose, so reporting the request builds a URL pointing at nothing.
       * The type admits undefined for a unix socket, which a bind carrying a
       * hostname and a port never is, and the request is the honest fallback.
       */
      return { server, port: server.port ?? port }
    } catch {
      /* In use. The next port is tried rather than reported. */
    }
  }
  return undefined
}

export async function respond(
  root: string,
  request: Request,
): Promise<Response> {
  const { pathname } = new URL(request.url)
  const target = resolveWithin(root, pathname)
  if (!target) {
    return new Response('Forbidden\n', {
      status: 403,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  let path = target
  if (existsSync(path) && statSync(path).isDirectory()) {
    path = join(path, DEFAULT_ENTRY)
  }

  const file = Bun.file(path)
  if (!(await file.exists())) {
    return new Response(`Not found: ${pathname}\n`, {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }

  return new Response(file, {
    headers: {
      'content-type': contentType(path),
      /**
       * A preview is edited and reloaded continuously, and a cached stylesheet
       * reads as a fix that did not work. Revalidation is the whole point of
       * the surface, so it is not negotiable per response.
       */
      'cache-control': 'no-store',
    },
  })
}

export function startServer(
  dir: string,
  options: ServeOptions = {},
): ServeOutcome {
  const root = resolve(process.cwd(), dir)
  if (!existsSync(root)) return refuse('no-root', `${dir} does not exist`)
  if (!statSync(root).isDirectory())
    return refuse('not-a-directory', `${dir} is not a directory`)

  const entry = (options.entry ?? DEFAULT_ENTRY).replace(/^\/+/, '')
  const first = options.port ?? DEFAULT_PORT
  const bound = listen(root, first)
  if (!bound) {
    return refuse(
      'no-port',
      `no free port between ${first} and ${first + PORT_ATTEMPTS - 1}`,
    )
  }

  const entryPath = resolveWithin(root, entry)
  return {
    ok: true,
    root,
    host: SERVE_HOST,
    port: bound.port,
    entry,
    url: `http://${SERVE_HOST}:${bound.port}/${entry}`,
    entryExists: entryPath !== undefined && existsSync(entryPath),
    stop: async () => {
      await bound.server.stop(true)
    },
  }
}
