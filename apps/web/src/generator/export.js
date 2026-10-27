// Export rows as plain text, CSV or JSON. Every function takes the rows to export,
// so callers decide whether that is everything or only what the filters matched.
import { columnsOf, hasCase, isTable } from "./rows.js";

const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;

// `cols` is the column order to use for types with several fields (as arranged in the table).
export function toCsv(rows, cols = columnsOf(rows)) {
  const withCase = hasCase(rows);
  const caseCols = withCase ? ["expected", "reason"] : [];
  const caseVals = (r) => (withCase ? [r.ok ? "valid" : "invalid", r.ok ? "" : r.note] : []);
  const header = isTable(rows) ? cols : ["value"];
  const cells = (r) => (isTable(rows) ? cols.map((c) => r.value[c]) : [r.value]);
  return [[...header, ...caseCols], ...rows.map((r) => [...cells(r), ...caseVals(r)])].map((line) => line.map(esc).join(",")).join("\n");
}

/** What one row looks like in JSON: the value itself, or with its expected result for types with negative cases. */
function toJsonValue(r, cols) {
  const value = cols && typeof r.value === "object" ? Object.fromEntries(cols.map((c) => [c, r.value[c]])) : r.value;
  return r.ok === undefined ? value : { value, expected: r.ok ? "valid" : "invalid", reason: r.ok ? "" : r.note };
}

export const toJson = (rows, cols) => JSON.stringify(rows.map((r) => toJsonValue(r, cols)), null, 2);

/** A single row as a JSON object, for the copy-row button. */
export const rowToJson = (r, cols) => JSON.stringify(toJsonValue(r, cols), null, 2);

/** One value per line; tables are copied as CSV so columns survive a paste into a sheet. */
export const toText = (rows, cols) => (isTable(rows) ? toCsv(rows, cols) : rows.map((r) => r.value).join("\n"));
