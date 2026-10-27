// Column widths for the result table, fixed up front so every value shows in full and
// columns don't shift while the virtual list swaps rows in and out during scrolling.
// Character count is a good guide to width, so only the longest few values per column
// are measured with the real font.

const CANDIDATES = 8;

/**
 * The longest distinct texts of each column, longest first.
 * @param {string[]} texts
 * @returns {string[]}
 */
export function longestTexts(texts, limit = CANDIDATES) {
  const top = [];
  for (const t of texts) {
    if (top.length === limit && t.length <= top[top.length - 1].length) continue;
    if (top.includes(t)) continue;
    top.push(t);
    top.sort((a, b) => b.length - a.length);
    if (top.length > limit) top.pop();
  }
  return top;
}

/**
 * Width in px for each column: the widest of its header and its longest values, plus padding.
 * @param {{ header: string, texts: string[] }[]} columns
 * @param {(text: string) => number} measure width of one cell's text in px
 * @param {number} padding horizontal padding and border of a cell
 * @returns {number[]}
 */
export function columnWidths(columns, measure, padding) {
  return columns.map(({ header, texts }) => {
    const widest = Math.max(measure(header), ...longestTexts(texts).map(measure));
    return Math.ceil(widest + padding);
  });
}

/**
 * Shrink columns so they fit `available` px, taking width from the widest columns first, so
 * short columns keep their full width and long ones (an address) wrap. No column goes below
 * its minimum, so the result can still be wider than `available` when the minimums don't fit.
 * @param {number[]} widths natural widths
 * @param {number} available
 * @param {number[]} mins smallest width for each column
 * @returns {number[]}
 */
export function fitToWidth(widths, available, mins) {
  const sum = (cap) => widths.reduce((s, w, k) => s + Math.max(mins[k], Math.min(w, cap)), 0);
  if (sum(Infinity) <= available) return [...widths];
  let lo = 0;
  let hi = Math.max(...widths);
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (sum(mid) <= available) lo = mid;
    else hi = mid;
  }
  return widths.map((w, k) => Math.floor(Math.max(mins[k], Math.min(w, lo))));
}
