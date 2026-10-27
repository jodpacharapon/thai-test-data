// Result filtering: text or regex search, valid/invalid status, and invalid reason.
import { compileRegex } from "../core/regex.js";

/** What search looks at: the value (each column for tables) and the status note. */
const fieldsOf = (r) => [
  ...(typeof r.value === "object" ? Object.values(r.value) : [r.value]).map(String),
  r.ok === undefined ? "" : r.ok ? r.okNote ?? "" : r.note,
];

/**
 * Build a predicate for the search box. Plain text is case-insensitive and every
 * space-separated word must appear somewhere in the row. Regex mode tests each field
 * on its own (flag i), so ^ and $ anchor to a value, e.g. ^8\d{12}$.
 * @returns {{ test: (row: object) => boolean, error?: string }}
 */
export function searchPredicate(query, isRegex) {
  const q = query.trim();
  if (!q) return { test: () => true };
  if (isRegex) {
    const { re, error } = compileRegex(q, "i");
    if (error) return { test: () => true, error };
    return { test: (r) => fieldsOf(r).some((f) => re.test(f)) };
  }
  const words = q.toLowerCase().split(/\s+/);
  return { test: (r) => { const h = fieldsOf(r).join(" ").toLowerCase(); return words.every((w) => h.includes(w)); } };
}

/**
 * Apply all filters. Returns the indices of matching rows (so row numbers stay the original ones)
 * plus counts for the status and reason filters, taken after search but before status/reason.
 * @param {object[]} rows
 * @param {{ query?: string, isRegex?: boolean, status?: "all"|"valid"|"invalid", reason?: string }} f
 */
export function filterRows(rows, { query = "", isRegex = false, status = "all", reason = "all" } = {}) {
  const search = searchPredicate(query, isRegex);
  const counts = { all: 0, valid: 0, invalid: 0 };
  const reasons = new Map();
  const indices = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!search.test(r)) continue;
    counts.all++;
    if (r.ok === true) counts.valid++;
    if (r.ok === false) { counts.invalid++; reasons.set(r.note, (reasons.get(r.note) ?? 0) + 1); }
    if (status === "valid" && r.ok !== true) continue;
    if (status === "invalid" && r.ok !== false) continue;
    if (reason !== "all" && r.note !== reason) continue;
    indices.push(i);
  }
  return { indices, counts, reasons: [...reasons].sort((a, b) => b[1] - a[1]), error: search.error };
}

/** Slice of `indices` for a page; `pageSize` Infinity means one page with everything. */
export function paginate(indices, page, pageSize) {
  const pages = Math.max(1, Math.ceil(indices.length / pageSize));
  const p = Math.min(Math.max(0, page), pages - 1);
  const from = Number.isFinite(pageSize) ? p * pageSize : 0;
  const to = Number.isFinite(pageSize) ? from + pageSize : indices.length;
  return { page: p, pages, from, items: indices.slice(from, to) };
}
