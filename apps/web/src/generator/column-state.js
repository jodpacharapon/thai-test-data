// The column order and widths a person set by dragging table headers. Kept per set of columns
// (e.g. the person fields picked), so going back to a set brings back its arrangement.

const keyOf = (cols) => [...cols].sort().join("\u0000");

export function createColumnState() {
  const saved = new Map(); // key → { order: string[], widths: Map<string, number> }
  const entry = (cols) => {
    const key = keyOf(cols);
    if (!saved.has(key)) saved.set(key, { order: [], widths: new Map() });
    return saved.get(key);
  };

  return {
    /** `cols` in the arranged order; columns never arranged keep their own order, after the others. */
    order(cols) {
      const { order } = entry(cols);
      return [...order.filter((c) => cols.includes(c)), ...cols.filter((c) => !order.includes(c))];
    },
    /** Move `col` to position `to` of the arranged order. */
    move(cols, col, to) {
      const next = this.order(cols).filter((c) => c !== col);
      next.splice(Math.max(0, Math.min(to, next.length)), 0, col);
      entry(cols).order = next;
    },
    /** Width set by dragging a header's edge, or undefined. */
    widthOf(cols, col) { return entry(cols).widths.get(col); },
    setWidth(cols, col, px) { entry(cols).widths.set(col, px); },
    isCustom(cols) {
      const e = entry(cols);
      return e.widths.size > 0 || this.order(cols).some((c, k) => c !== cols[k]);
    },
    reset(cols) { saved.delete(keyOf(cols)); },
  };
}
