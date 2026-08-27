/**
 * What every browser-driving command needs to know before it can report a
 * failure honestly: how the binary is installed, and how each of the two ways
 * it can be absent reads when it is thrown.
 *
 * The two are different states with different remedies. A package that never
 * resolved means the target installed the CLI without the engine, and a binary
 * that was never downloaded means the engine is present and its browser is not.
 * Both were spelled inside `src/demo/` when `demo` was the only command driving
 * a browser, and a second command is what makes them shared rather than local.
 */

/** Fetches the browser revision the pinned engine expects. */
export const INSTALL_BROWSER = 'bunx playwright install chromium'

/**
 * Separates a browser binary that was never installed from every other launch
 * failure, because the first is a setup step the operator has to run and the
 * second is a defect. A target inherits that setup step, which is the stated
 * cost of shipping a browser command outside the toolkit.
 */
export function isBrowserMissing(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error)
  return /executable doesn't exist|playwright install/i.test(text)
}

/**
 * Reports the engine package failing to resolve, which is the case a target
 * hits before installing it. Any other import failure is a defect inside the
 * module being loaded and propagates, rather than being reported as a missing
 * dependency.
 */
export function isEngineMissing(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ERR_MODULE_NOT_FOUND'
  )
}
