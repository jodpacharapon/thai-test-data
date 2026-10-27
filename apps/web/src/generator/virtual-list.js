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
  const rendered = new Map(); // position → row element currently in the DOM
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
    if (!items.length) { body.replaceChildren(); rendered.clear(); range = [-1, -1]; return; }
    // Measuring swaps in a single row, which would clamp scrollTop to 0; keep it and restore after.
    const keepTop = scroller.scrollTop;
    const remeasured = !rowH;
    if (remeasured) { measure(); range = [-1, -1]; }
    const offset = body.firstChild ? bodyOffset() : 0;
    const viewTop = Math.max(0, keepTop - offset);
    const first = Math.max(0, Math.floor(viewTop / rowH) - OVERSCAN);
    const last = Math.min(items.length, first + Math.ceil(scroller.clientHeight / rowH) + OVERSCAN * 2);
    if (first === range[0] && last === range[1]) return;
    top.setHeight(first * rowH);
    bottom.setHeight((items.length - last) * rowH);
    if (remeasured || last <= range[0] || first >= range[1]) rebuild(first, last);
    else shift(first, last);
    range = [first, last];
    if (remeasured) scroller.scrollTop = keepTop;
  }

  function rebuild(first, last) {
    rendered.clear();
    const frag = document.createDocumentFragment();
    frag.append(top.node);
    for (let i = first; i < last; i++) frag.append(rowAt(i));
    frag.append(bottom.node);
    body.replaceChildren(frag);
  }

  // Rows still in view are left where they are; only rows entering or leaving at the edges change.
  // Moving or re-creating a focused row (e.g. one just clicked to copy) would make the browser
  // jump the scroll position, which is why this doesn't simply rebuild every time.
  function shift(first, last) {
    const [oldFirst, oldLast] = range;
    for (let i = oldFirst; i < oldLast; i++) {
      if (i < first || i >= last) { rendered.get(i)?.remove(); rendered.delete(i); }
    }
    const before = document.createDocumentFragment();
    for (let i = first; i < Math.min(oldFirst, last); i++) before.append(rowAt(i));
    top.node.after(before);
    const after = document.createDocumentFragment();
    for (let i = Math.max(oldLast, first); i < last; i++) after.append(rowAt(i));
    bottom.node.before(after);
  }

  function rowAt(i) {
    const node = makeRow(items[i], i);
    rendered.set(i, node);
    return node;
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
      rendered.clear();
      range = [-1, -1];
    },
  };
}
