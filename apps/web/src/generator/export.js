// Export rows as plain text, CSV or JSON. Every function takes the rows to export,
// so callers decide whether that is everything or only what the filters matched.
import { columnsOf, hasCase, isTable } from "./rows.js";

const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;

export function toCsv(rows) {
  const withCase = hasCase(rows);
  const caseCols = withCase ? ["expected", "reason"] : [];
  const caseVals = (r) => (withCase ? [r.ok ? "valid" : "invalid", r.ok ? "" : r.note] : []);
  const cols = columnsOf(rows);
  const header = isTable(rows) ? cols : ["value"];
  const cells = (r) => (isTable(rows) ? cols.map((c) => r.value[c]) : [r.value]);
  return [[...header, ...caseCols], ...rows.map((r) => [...cells(r), ...caseVals(r)])].map((line) => line.map(esc).join(",")).join("\n");
}

/** What one row looks like in JSON: the value itself, or with its expected result for types with negative cases. */
const toJsonValue = (r) => (r.ok === undefined ? r.value : { value: r.value, expected: r.ok ? "valid" : "invalid", reason: r.ok ? "" : r.note });

export const toJson = (rows) => JSON.stringify(rows.map(toJsonValue), null, 2);

/** A single row as a JSON object, for the copy-row button. */
export const rowToJson = (r) => JSON.stringify(toJsonValue(r), null, 2);

/** One value per line; tables are copied as CSV so columns survive a paste into a sheet. */
export const toText = (rows) => (isTable(rows) ? toCsv(rows) : rows.map((r) => r.value).join("\n"));
