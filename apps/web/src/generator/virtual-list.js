// Windowed rendering: only the rows inside the scroll viewport (plus a margin) exist in the DOM,
// so 100,000 rows scroll as smoothly as 50. Rows may differ in height (e.g. cards whose text wraps):
// rows not yet rendered count as the height of the first row, and each row's real height is
// measured once it is rendered. Heights are re-measured when the scroller's width changes.

import { indexAt, offsetsOf } from "./row-offsets.js";

const OVERSCAN = 10;
const FALLBACK_ROW_HEIGHT = 40;
// A height change smaller than this is rounding noise, not a different row height.
const HEIGHT_EPSILON = 0.5;
// Measuring can change which rows are in view; repaint at most this many times per scroll event.
const MAX_SETTLE_PASSES = 3;

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
  let estimate = 0; // height of the first row, used for rows not measured yet; 0 = measure again
  let heights = new Float64Array(0);
  let tops = new Float64Array(1); // tops[i] = height of rows before i; tops[items.length] = total
  let range = [-1, -1];
  const rendered = new Map(); // position → row element currently in the DOM
  const unmeasured = new Set(); // positions rendered since the last measure
  const top = makeSpacer();
  const bottom = makeSpacer();

  // Distance from the top of the scroll content to the first row (e.g. a sticky table header).
  const bodyOffset = () => body.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;

  function reset() {
    const probe = makeRow(items[0], 0);
    body.replaceChildren(probe);
    estimate = probe.getBoundingClientRect().height || FALLBACK_ROW_HEIGHT;
    heights = new Float64Array(items.length).fill(estimate);
    tops = offsetsOf(heights);
    rendered.clear();
    unmeasured.clear();
    range = [-1, -1];
  }

  function paint() {
    if (!active) return;
    if (!items.length) { body.replaceChildren(); rendered.clear(); range = [-1, -1]; return; }
    // Measuring swaps in a single row, which would clamp scrollTop to 0; keep it and restore after.
    const keepTop = scroller.scrollTop;
    const restore = !estimate;
    if (restore) reset();
    for (let pass = 0; pass < MAX_SETTLE_PASSES && place(); pass++);
    if (restore) scroller.scrollTop = keepTop;
  }

  // Render the rows in view, then measure new ones. Returns true when measuring changed a height,
  // so the rows in view may differ and paint should place again.
  function place() {
    const offset = body.firstChild ? bodyOffset() : 0;
    const viewTop = Math.max(0, scroller.scrollTop - offset);
    const first = Math.max(0, indexAt(tops, viewTop) - OVERSCAN);
    const last = Math.min(items.length, indexAt(tops, viewTop + scroller.clientHeight) + 1 + OVERSCAN);
    if (first !== range[0] || last !== range[1]) {
      setSpacers(first, last);
      if (last <= range[0] || first >= range[1]) rebuild(first, last);
      else shift(first, last);
      range = [first, last];
    }
    return measure(viewTop);
  }

  function setSpacers(first, last) {
    top.setHeight(tops[first]);
    bottom.setHeight(tops[items.length] - tops[last]);
  }

  function measure(viewTop) {
    if (!unmeasured.size) return false;
    let changed = false;
    let above = 0; // growth of rows above the view, which would push the visible rows down
    for (const i of unmeasured) {
      const h = rendered.get(i)?.getBoundingClientRect().height;
      if (!h || Math.abs(h - heights[i]) < HEIGHT_EPSILON) continue;
      if (tops[i] + heights[i] <= viewTop) above += h - heights[i];
      heights[i] = h;
      changed = true;
    }
    unmeasured.clear();
    if (!changed) return false;
    tops = offsetsOf(heights);
    setSpacers(range[0], range[1]);
    // Keep the rows on screen where they were instead of letting them jump.
    if (above) scroller.scrollTop += above;
    return true;
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
    unmeasured.add(i);
    return node;
  }

  // Scroll and resize callbacks already arrive at most once per frame, so painting directly is enough.
  scroller.addEventListener("scroll", paint, { passive: true });
  let lastWidth = 0;
  new ResizeObserver(([entry]) => {
    const w = Math.round(entry.contentRect.width);
    if (w !== lastWidth) { lastWidth = w; estimate = 0; }
    paint();
  }).observe(scroller);

  return {
    /** Replace the rows and make this list the one painting into the scroller. `render(item, position)` builds one row. */
    set(nextItems, render) {
      items = nextItems;
      makeRow = render;
      active = true;
      estimate = 0;
      scroller.scrollTop = 0;
      paint();
    },
    /** Stop painting (another list now owns the scroller) and release the rows. */
    detach() {
      active = false;
      items = [];
      rendered.clear();
      unmeasured.clear();
      range = [-1, -1];
    },
  };
}
