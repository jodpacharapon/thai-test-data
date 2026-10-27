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
