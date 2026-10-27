// Generator view: type list → settings → Count/Seed/Unique → filtered, virtualized results.
import { $, fmt } from "../core/dom.js";
import { TYPES } from "./types.js";
import { clampCount, generateRows } from "./rows.js";
import { initTypeList } from "./type-list.js";
import { renderConfig } from "./config-panel.js";
import { createResults } from "./results.js";

// Settings per type, kept while switching between types.
const settings = Object.fromEntries(TYPES.map((t) => [t.key, Object.fromEntries(t.controls.map((c) => [c.id, Array.isArray(c.def) ? [...c.def] : c.def]))]));
let current = TYPES[0];

const readSeed = () => ($("seed").value === "" ? undefined : Number($("seed").value));

/** Set up the Generator. Returns a function giving the current state, which the Report form attaches as context. */
export function initGenerator() {
  const results = createResults({ fileName: () => `thai-test-data-${current.key}.csv` });
  const markSelected = initTypeList(select);

  function generate() {
    const count = clampCount($("count").value);
    $("count").value = count;
    const rows = generateRows(current, settings[current.key], { count, seed: readSeed(), unique: $("unique").checked });
    $("shortfall").textContent = rows.length < count ? `unique ได้แค่ ${fmt(rows.length)} จาก ${fmt(count)}` : "";
    results.setRows(rows);
  }

  function select(t) {
    current = t;
    markSelected(t);
    $("typeTitle").textContent = t.title;
    $("typeDesc").textContent = t.desc;
    renderConfig(t, settings[t.key], generate);
    generate();
  }

  $("regen").addEventListener("click", generate);
  ["count", "seed", "unique"].forEach((id) => $(id).addEventListener("change", generate));
  document.querySelectorAll("[data-count]").forEach((b) => b.addEventListener("click", () => {
    $("count").value = b.dataset.count;
    generate();
  }));
  select(TYPES[0]);

  return () => ({ type: current, settings: settings[current.key], count: $("count").value, seed: $("seed").value, rows: results.rows() });
}
