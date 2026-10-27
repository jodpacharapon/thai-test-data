// Table column sizing (src/generator/column-widths.js), run against the built dist/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { columnWidths, longestTexts } from "../dist/src/generator/column-widths.js";

// 10px per character stands in for the real font.
const measure = (t) => t.length * 10;

test("longestTexts keeps the longest distinct values, longest first", () => {
  assert.deepEqual(longestTexts(["a", "ccc", "bb", "ccc", "dddd"], 2), ["dddd", "ccc"]);
});

test("each column is as wide as its longest value plus padding", () => {
  const widths = columnWidths([
    { header: "ชื่อ", texts: ["สมชาย ใจดี", "มาลี"] },
    { header: "ที่อยู่", texts: ["99/1 หมู่ 2 ถนนสุขุมวิท คลองเตย คลองเตย กรุงเทพมหานคร 10110"] },
  ], measure, 34);
  assert.deepEqual(widths, [10 * 10 + 34, 59 * 10 + 34]);
});

test("a header longer than every value sets the width", () => {
  assert.deepEqual(columnWidths([{ header: "รหัสไปรษณีย์", texts: ["10110"] }], measure, 0), [120]);
});

test("the widest value wins even when it isn't in the first rows", () => {
  const texts = Array.from({ length: 5000 }, (_, i) => (i === 4321 ? "x".repeat(80) : "short"));
  assert.deepEqual(columnWidths([{ header: "h", texts }], measure, 0), [800]);
});
