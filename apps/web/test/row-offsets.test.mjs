import { test } from "node:test";
import assert from "node:assert/strict";
import { indexAt, offsetsOf } from "../src/generator/row-offsets.js";

test("offsetsOf gives each row's top and the total height", () => {
  assert.deepEqual([...offsetsOf([40, 90, 40])], [0, 40, 130, 170]);
  assert.deepEqual([...offsetsOf([])], [0]);
});

test("indexAt finds the row at a position when rows differ in height", () => {
  const tops = offsetsOf([40, 90, 40]);
  assert.equal(indexAt(tops, 0), 0);
  assert.equal(indexAt(tops, 39.9), 0);
  assert.equal(indexAt(tops, 40), 1);
  assert.equal(indexAt(tops, 129), 1);
  assert.equal(indexAt(tops, 130), 2);
});

test("indexAt clamps positions past the end to the last row", () => {
  assert.equal(indexAt(offsetsOf([40, 40]), 10_000), 1);
  assert.equal(indexAt(offsetsOf([]), 50), 0);
});
