// Row generation (src/generator/rows.js) and exports (src/generator/export.js), run against the built dist/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidThaiId } from "../dist/lib/index.js";
import { TYPES } from "../dist/src/generator/types.js";
import { clampCount, generateRows, MAX_COUNT } from "../dist/src/generator/rows.js";
import { rowToJson, toCsv, toJson, toText } from "../dist/src/generator/export.js";

const citizen = TYPES.find((t) => t.key === "citizen");
const defaults = (t) => Object.fromEntries(t.controls.map((c) => [c.id, Array.isArray(c.def) ? [...c.def] : c.def]));

test("generates the requested number of valid citizen IDs", () => {
  const rows = generateRows(citizen, defaults(citizen), { count: 500 });
  assert.equal(rows.length, 500);
  assert.ok(rows.every((r) => r.ok === true && isValidThaiId(r.value)));
});

test("the same seed gives the same rows", () => {
  const a = generateRows(citizen, defaults(citizen), { count: 20, seed: 42 });
  const b = generateRows(citizen, defaults(citizen), { count: 20, seed: 42 });
  assert.deepEqual(a, b);
});

test("mixed case produces both valid and invalid rows with reasons", () => {
  const rows = generateRows(citizen, { ...defaults(citizen), case: "mixed" }, { count: 400, seed: 1 });
  const invalid = rows.filter((r) => r.ok === false);
  assert.ok(invalid.length > 100 && invalid.length < 300);
  assert.ok(invalid.every((r) => !isValidThaiId(r.value) && r.note));
});

test("unique mode returns only distinct values", () => {
  const emailType = TYPES.find((t) => t.key === "email");
  const rows = generateRows(emailType, defaults(emailType), { count: 50, seed: 3, unique: true });
  assert.equal(new Set(rows.map((r) => r.value)).size, rows.length);
});

test("clampCount keeps counts between 1 and MAX_COUNT", () => {
  assert.equal(clampCount("0"), 1);
  assert.equal(clampCount("abc"), 1);
  assert.equal(clampCount("12.7"), 12);
  assert.equal(clampCount(String(MAX_COUNT + 1)), MAX_COUNT);
});

test("CSV quotes values and adds expected/reason columns for test cases", () => {
  const csv = toCsv([{ value: 'a"b', ok: true, note: "x" }, { value: "c", ok: false, note: "bad, really" }]);
  assert.equal(csv, '"value","expected","reason"\n"a""b","valid",""\n"c","invalid","bad, really"');
});

test("CSV of table rows uses the columns as headers", () => {
  assert.equal(toCsv([{ value: { ชื่อ: "สมชาย", เบอร์: "081" } }]), '"ชื่อ","เบอร์"\n"สมชาย","081"');
});

test("JSON keeps plain values plain and adds expected for test cases", () => {
  assert.deepEqual(JSON.parse(toJson([{ value: "a" }])), ["a"]);
  assert.deepEqual(JSON.parse(toJson([{ value: "b", ok: false, note: "short" }])), [{ value: "b", expected: "invalid", reason: "short" }]);
});

test("text export is one value per line, or CSV for tables", () => {
  assert.equal(toText([{ value: "a" }, { value: "b" }]), "a\nb");
  assert.equal(toText([{ value: { x: "1" } }]), '"x"\n"1"');
});

test("rowToJson copies one row as an object, with its expected result when the type has one", () => {
  assert.deepEqual(JSON.parse(rowToJson({ value: { ชื่อ: "ก", เลขบัตร: "1" } })), { ชื่อ: "ก", เลขบัตร: "1" });
  assert.deepEqual(JSON.parse(rowToJson({ value: "b", ok: false, note: "short" })), { value: "b", expected: "invalid", reason: "short" });
});

test("name type uses child titles when asked", () => {
  const nameType = TYPES.find((t) => t.key === "name");
  const rows = generateRows(nameType, { ...defaults(nameType), titles: "child" }, { count: 50, seed: 4 });
  assert.ok(rows.every((r) => /^เด็ก(ชาย|หญิง)/.test(r.value)));
});

test("unique mode stops early, without throwing, when values run out", () => {
  const postal = TYPES.find((t) => t.key === "postal");
  const rows = generateRows(postal, { ...defaults(postal), province: "สมุทรสงคราม" }, { count: 100, seed: 1, unique: true });
  assert.ok(rows.length > 0 && rows.length < 100);
});
