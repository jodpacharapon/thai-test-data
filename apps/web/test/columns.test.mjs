import { test } from "node:test";
import assert from "node:assert/strict";
import { fitToWidth } from "../src/generator/column-widths.js";
import { createColumnState } from "../src/generator/column-state.js";

test("fitToWidth keeps natural widths when they fit", () => {
  assert.deepEqual(fitToWidth([100, 200], 400, [50, 50]), [100, 200]);
});

test("fitToWidth shrinks the widest columns first and keeps short ones whole", () => {
  const out = fitToWidth([100, 120, 700], 600, [60, 60, 60]);
  assert.deepEqual(out.slice(0, 2), [100, 120]);
  assert.ok(out[2] <= 380 && out[2] >= 378);
});

test("fitToWidth never goes below the minimums", () => {
  assert.deepEqual(fitToWidth([300, 300], 100, [80, 90]), [80, 90]);
});

test("column state moves columns and keeps new ones after the arranged ones", () => {
  const s = createColumnState();
  const cols = ["a", "b", "c"];
  assert.deepEqual(s.order(cols), cols);
  assert.equal(s.isCustom(cols), false);
  s.move(cols, "c", 0);
  assert.deepEqual(s.order(cols), ["c", "a", "b"]);
  assert.equal(s.isCustom(cols), true);
  // The same set in another order is the same arrangement.
  assert.deepEqual(s.order(["b", "a", "c"]), ["c", "a", "b"]);
  s.reset(cols);
  assert.deepEqual(s.order(cols), cols);
});

test("column state remembers widths per set of columns", () => {
  const s = createColumnState();
  s.setWidth(["a", "b"], "a", 150);
  assert.equal(s.widthOf(["a", "b"], "a"), 150);
  assert.equal(s.widthOf(["a", "b", "c"], "a"), undefined);
  assert.equal(s.isCustom(["b", "a"]), true);
});
