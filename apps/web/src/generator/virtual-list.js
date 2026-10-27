// Windowed rendering: only the rows inside the scroll viewport (plus a margin) exist in the DOM,
// so 100,000 rows scroll as smoothly as 50. Rows must share one height, which is measured from
// the first row and re-measured when the scroller is resized (e.g. the mobile layout kicks in).

const OVERSCAN = 10;
const FALLBACK_ROW_HEIGHT = 40;

/**
 * @param {object} opts
 * @param {HTMLElement} opts.scroller element with overflow: auto
 * @param {HTMLElement} opts.body element the rows go into (an <ol> or <tbody>)
 * @param {() => { node: HTMLElement, setHeight: (px: number) => void }} opts.makeSpacer
 */
export function createVirtualList({ scroller, body, makeSpacer }) {
  let items = [];
  let makeRow = () => document.createElement("div");
  let active = false;
  let rowH = 0;
  let range = [-1, -1];
  const top = makeSpacer();
  const bottom = makeSpacer();

  // Distance from the top of the scroll content to the first row (e.g. a sticky table header).
  const bodyOffset = () => body.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;

  function measure() {
    const probe = makeRow(items[0], 0);
    body.replaceChildren(probe);
    rowH = probe.getBoundingClientRect().height || FALLBACK_ROW_HEIGHT;
  }

  function paint() {
    if (!active) return;
    if (!items.length) { body.replaceChildren(); range = [-1, -1]; return; }
    // Measuring swaps in a single row, which would clamp scrollTop to 0; keep it and restore after.
    const keepTop = scroller.scrollTop;
    const remeasured = !rowH;
    if (remeasured) { measure(); range = [-1, -1]; }
    const offset = body.firstChild ? bodyOffset() : 0;
    const viewTop = Math.max(0, keepTop - offset);
    const first = Math.max(0, Math.floor(viewTop / rowH) - OVERSCAN);
    const last = Math.min(items.length, first + Math.ceil(scroller.clientHeight / rowH) + OVERSCAN * 2);
    if (first === range[0] && last === range[1]) return;
    range = [first, last];

    // Keep keyboard focus on a row that survives the repaint.
    const focusedKey = body.contains(document.activeElement) ? document.activeElement.dataset.i : undefined;
    const frag = document.createDocumentFragment();
    frag.append(top.node);
    for (let i = first; i < last; i++) frag.append(makeRow(items[i], i));
    frag.append(bottom.node);
    top.setHeight(first * rowH);
    bottom.setHeight((items.length - last) * rowH);
    body.replaceChildren(frag);
    if (remeasured) scroller.scrollTop = keepTop;
    if (focusedKey !== undefined) body.querySelector(`[data-i="${focusedKey}"]`)?.focus({ preventScroll: true });
  }

  // Scroll and resize callbacks already arrive at most once per frame, so painting directly is enough.
  scroller.addEventListener("scroll", paint, { passive: true });
  let lastWidth = 0;
  new ResizeObserver(([entry]) => {
    const w = Math.round(entry.contentRect.width);
    if (w !== lastWidth) { lastWidth = w; rowH = 0; }
    paint();
  }).observe(scroller);

  return {
    /** Replace the rows and make this list the one painting into the scroller. `render(item, position)` builds one row. */
    set(nextItems, render) {
      items = nextItems;
      makeRow = render;
      active = true;
      rowH = 0;
      scroller.scrollTop = 0;
      paint();
    },
    /** Stop painting (another list now owns the scroller) and release the rows. */
    detach() {
      active = false;
      items = [];
      range = [-1, -1];
    },
  };
}
