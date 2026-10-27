// Producing result rows. A row is { value, ok?, note?, okNote? }: `ok` is set only for
// types that can produce negative cases, and `value` is a string or, for table types, an object.
import { createThaiData, seededRng } from "../../lib/index.js";

export const MAX_COUNT = 100000;

export const norm = (it) => (it && typeof it === "object" && "value" in it ? it : { value: it });
export const hasCase = (rows) => rows.length > 0 && rows[0].ok !== undefined;
export const isTable = (rows) => rows.length > 0 && typeof rows[0].value === "object";
export const columnsOf = (rows) => (isTable(rows) ? Object.keys(rows[0].value) : []);
export const statusText = (r) => (r.ok ? (r.okNote ? "Valid · " + r.okNote : "Valid") : "Invalid · " + r.note);
export const clampCount = (n) => Math.min(MAX_COUNT, Math.max(1, Math.floor(Number(n)) || 1));

/**
 * Generate `count` rows of `type` with settings `o`. With `unique`, retries until values
 * are distinct; types with few possible values stop early and return fewer rows.
 * @param {{ gen: Function }} type
 * @param {object} o settings for the type
 * @param {{ count: number, seed?: number, unique?: boolean }} run
 */
export function generateRows(type, o, { count, seed, unique = false }) {
  const td = createThaiData(seed === undefined ? {} : { seed });
  const rng = seed === undefined ? Math.random : seededRng(seed + 7919);
  const next = () => norm(type.gen(td, o, rng));
  if (!unique) return Array.from({ length: count }, next);
  const seen = new Set();
  const rows = [];
  for (let i = 0; i < count * 50 + 100 && rows.length < count; i++) {
    const r = next();
    const key = JSON.stringify(r.value);
    if (!seen.has(key)) { seen.add(key); rows.push(r); }
  }
  return rows;
}
