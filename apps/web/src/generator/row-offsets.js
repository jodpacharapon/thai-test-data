// Row positions for the virtual list, kept apart from the DOM so they can be unit tested.

/**
 * Running totals of row heights: result[i] is the top of row i, result[n] the total height.
 * @param {ArrayLike<number>} heights
 * @returns {Float64Array}
 */
export function offsetsOf(heights) {
  const tops = new Float64Array(heights.length + 1);
  for (let i = 0; i < heights.length; i++) tops[i + 1] = tops[i] + heights[i];
  return tops;
}

/**
 * The row at vertical position `y`, clamped to the last row.
 * @param {Float64Array} tops from offsetsOf
 * @param {number} y
 */
export function indexAt(tops, y) {
  const n = tops.length - 1;
  if (n <= 0) return 0;
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (tops[mid] <= y) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
