// Result filtering and pagination (src/generator/filter.js), run against the built dist/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { filterRows, paginate, searchPredicate } from "../dist/src/generator/filter.js";

const rows = [
  { value: "1234567890121", ok: true, note: "บุคคลธรรมดา ประเภท 1" },
  { value: "8234567890122", ok: false, note: "wrong check digit" },
  { value: "823456789012", ok: false, note: "12 digits" },
  { value: "3234567890123", ok: true, note: "บุคคลธรรมดา ประเภท 3" },
];

test("returns every row and its counts when no filter is set", () => {
  const r = filterRows(rows);
  assert.deepEqual(r.indices, [0, 1, 2, 3]);
  assert.deepEqual(r.counts, { all: 4, valid: 2, invalid: 2 });
});

test("filters by status and keeps original row indices", () => {
  assert.deepEqual(filterRows(rows, { status: "invalid" }).indices, [1, 2]);
  assert.deepEqual(filterRows(rows, { status: "valid" }).indices, [0, 3]);
});

test("lists invalid reasons with counts and filters by one", () => {
  const r = filterRows(rows, { reason: "12 digits" });
  assert.deepEqual(r.indices, [2]);
  assert.deepEqual(Object.fromEntries(r.reasons), { "wrong check digit": 1, "12 digits": 1 });
});

test("plain search needs every word somewhere in the row, ignoring case", () => {
  assert.deepEqual(filterRows(rows, { query: "823 WRONG" }).indices, [1]);
});

test("regex search anchors to a single value, not the value joined with its note", () => {
  assert.deepEqual(filterRows(rows, { query: String.raw`^8\d{12}$`, isRegex: true }).indices, [1]);
});

test("regex search matches any column of a table row", () => {
  const table = [{ value: { name: "สมชาย", phone: "0812345678" } }, { value: { name: "มาลี", phone: "0212345678" } }];
  assert.deepEqual(filterRows(table, { query: "^08", isRegex: true }).indices, [0]);
});

test("an invalid regex reports an error and filters nothing out", () => {
  const p = searchPredicate("([bad", true);
  assert.match(p.error, /character class/i);
  assert.equal(p.test(rows[0]), true);
});

test("counts are taken after search but before the status filter", () => {
  const r = filterRows(rows, { query: "^8", isRegex: true, status: "valid" });
  assert.deepEqual(r.indices, []);
  assert.deepEqual(r.counts, { all: 2, valid: 0, invalid: 2 });
});

test("paginates and clamps the page into range", () => {
  const idx = Array.from({ length: 120 }, (_, i) => i);
  assert.deepEqual(paginate(idx, 0, 50), { page: 0, pages: 3, from: 0, items: idx.slice(0, 50) });
  assert.equal(paginate(idx, 9, 50).page, 2);
  assert.equal(paginate(idx, 2, 50).items.length, 20);
  assert.equal(paginate(idx, -1, 50).page, 0);
});

test("page size Infinity shows everything on one page", () => {
  const r = paginate([1, 2, 3], 0, Infinity);
  assert.deepEqual(r, { page: 0, pages: 1, from: 0, items: [1, 2, 3] });
});
