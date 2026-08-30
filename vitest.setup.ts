import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll } from 'vitest'

/**
 * Redirects this machine's toolkit state for the whole run.
 *
 * `putDomain` records every stamped target into the machine-level registry, so
 * a stamp test would otherwise write fixture paths into the state folder of
 * whoever ran the suite and leave them there. Setting the override once here
 * covers every test that reaches a sync, including ones written later that do
 * not know the write happens.
 */
const STATE = mkdtempSync(join(tmpdir(), 'aitk-test-state-'))

process.env.AITK_STATE_DIR = STATE

afterAll(() => {
  rmSync(STATE, { recursive: true, force: true })
})
