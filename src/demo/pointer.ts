/**
 * The pointer the recording shows. The browser engine's own annotation draws a
 * dot at the moment of a click and paints no cursor, so a run without this
 * looks like the pointer teleports between targets.
 *
 * Nothing here touches a browser. `pointerSource` returns the script text that
 * `@/demo/drive` installs before navigation, which keeps the hotspot arithmetic
 * and the state table testable without launching anything.
 */

export interface CursorHotspot {
  readonly width: number
  readonly height: number
  readonly hotspotX: number
  readonly hotspotY: number
}

export interface Cursor {
  readonly image: string
  readonly hotspot: CursorHotspot
}

export type CursorSet = Readonly<Record<string, Cursor>>

const HEADER_BYTES = 6
const ENTRY_BYTES = 16
const CURSOR_TYPE = 2
/** The format stores 256 as a zero, since the field is one byte wide. */
const SIZE_256 = 256

/**
 * Reads the directory of a Windows cursor resource and returns the hotspot of
 * its largest entry. A resource carries several sizes with a hotspot each, and
 * taking the largest is what matches the artwork the recorder draws at.
 *
 * Only the header and directory are read. The pixel payload is left to the
 * browser, which spike 3 measured as decoding the format directly with no
 * conversion step and no image tooling on the machine.
 */
export function cursorHotspot(bytes: Uint8Array): CursorHotspot | undefined {
  if (bytes.byteLength < HEADER_BYTES + ENTRY_BYTES) return undefined

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (view.getUint16(2, true) !== CURSOR_TYPE) return undefined

  const count = view.getUint16(4, true)
  if (count === 0) return undefined

  let largest: CursorHotspot | undefined
  for (let index = 0; index < count; index += 1) {
    const at = HEADER_BYTES + index * ENTRY_BYTES
    if (at + ENTRY_BYTES > bytes.byteLength) break

    const entry: CursorHotspot = {
      width: bytes[at] === 0 ? SIZE_256 : (bytes[at] ?? 0),
      height: bytes[at + 1] === 0 ? SIZE_256 : (bytes[at + 1] ?? 0),
      hotspotX: view.getUint16(at + 4, true),
      hotspotY: view.getUint16(at + 6, true),
    }
    if (!largest || entry.width * entry.height > largest.width * largest.height)
      largest = entry
  }
  return largest
}

/**
 * Converts a hotspot stated against the source artwork into an offset in the
 * size the pointer is drawn at. Skipping this puts the artwork's top left where
 * the click lands instead of its tip, which offsets every action by roughly a
 * third of a cursor.
 */
export function scaleHotspot(
  hotspot: CursorHotspot,
  drawnSize: number,
): { x: number; y: number } {
  const scale = drawnSize / hotspot.width
  return {
    x: hotspot.hotspotX * scale,
    y: hotspot.hotspotY * (drawnSize / hotspot.height),
  }
}

interface PointerState {
  readonly image: string
  readonly x: number
  readonly y: number
}

/**
 * Returns the script installed before navigation. It is a string rather than a
 * function reference because the cursor payload is data resolved on this side,
 * and passing artwork through an argument would still need serializing.
 *
 * The element inherits the page's world, so a site with its own element at this
 * id, a stacking context that outranks it, or a style rule reaching it will
 * interfere. That is the cost of drawing the pointer inside the page rather
 * than reaching for a desktop recorder.
 */
export function pointerSource(cursors: CursorSet, size: number): string {
  const states: Record<string, PointerState> = {}
  for (const [name, cursor] of Object.entries(cursors)) {
    const offset = scaleHotspot(cursor.hotspot, size)
    states[name] = { image: cursor.image, x: offset.x, y: offset.y }
  }

  const config = JSON.stringify({ size, states })

  return `(() => {
  const CONFIG = ${config};
  const ID = '__canon_demo_pointer__';
  if (window[ID]) return;
  window[ID] = true;

  let node;
  let state = 'default';
  let pressed = false;
  let x = -9999;
  let y = -9999;

  const install = () => {
    if (node || !document.body) return;
    node = document.createElement('img');
    node.id = ID;
    node.setAttribute('aria-hidden', 'true');
    node.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'width:' + CONFIG.size + 'px',
      'height:' + CONFIG.size + 'px',
      'z-index:2147483647',
      'pointer-events:none',
      'user-select:none',
      'will-change:transform',
      'transition:transform 90ms ease-out',
    ].join(';');
    document.body.appendChild(node);
    paint();
  };

  const paint = () => {
    if (!node) return;
    const cursor = CONFIG.states[state] || CONFIG.states.default;
    if (!cursor) return;
    if (node.getAttribute('src') !== cursor.image) node.setAttribute('src', cursor.image);
    const scale = pressed ? 0.88 : 1;
    node.style.transform =
      'translate(' + (x - cursor.x) + 'px,' + (y - cursor.y) + 'px) scale(' + scale + ')';
  };

  const stateAt = (target) => {
    if (!(target instanceof Element)) return 'default';
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return 'text';
    const style = getComputedStyle(target).cursor;
    if (style === 'pointer' && CONFIG.states.pointer) return 'pointer';
    if (style === 'text' && CONFIG.states.text) return 'text';
    return 'default';
  };

  addEventListener('mousemove', (event) => {
    x = event.clientX;
    y = event.clientY;
    state = stateAt(event.target);
    install();
    paint();
  }, true);

  addEventListener('mousedown', () => { pressed = true; paint(); }, true);
  addEventListener('mouseup', () => { pressed = false; paint(); }, true);

  if (document.readyState === 'loading') {
    addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();`
}
