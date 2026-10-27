// Validator view, laid out like a regex tester: pick a rule (or write a regex), type or paste
// values one per line, and every line is highlighted, marked in the gutter and explained.
import { $, el, fmt, copy, debounce, replaceKeepingFocus, segmented } from "../core/dom.js";
import { customRule, RULES, sampleText, testLines } from "./rules.js";
import { explain } from "./explain.js";

const MAX_LINES = 5000;
// Above this many lines, wait for a pause in typing before re-checking everything.
const LIVE_LINES = 400;
const CUSTOM = "custom";
const TABS = [...RULES.map((r) => [r.key, r.title]), [CUSTOM, "Custom regex"]];
const FILTERS = { all: "ทั้งหมด", ok: "ผ่าน", bad: "ไม่ผ่าน" };

const state = {
  ruleKey: RULES[0].key,
  texts: new Map(),
  custom: { source: String.raw`0[689]\d{8}`, flags: "", fullMatch: true },
  filter: "all",
  selected: 1,
  entries: [],
};

const currentRule = () => (state.ruleKey === CUSTOM
  ? customRule(state.custom.source, state.custom.flags, { fullMatch: state.custom.fullMatch })
  : RULES.find((r) => r.key === state.ruleKey));

export function initValidator() {
  const input = $("vxInput");

  function switchRule(key) {
    state.texts.set(state.ruleKey, input.value);
    state.ruleKey = key;
    if (!state.texts.has(key)) state.texts.set(key, sampleText(currentRule()));
    input.value = state.texts.get(key);
    state.selected = 1;
    paintTabs();
    paintPattern();
    run();
  }

  function paintTabs() {
    replaceKeepingFocus($("vxRules"), segmented("vxRule", TABS, state.ruleKey, switchRule, { ariaLabel: "กฎที่ใช้ตรวจ" }));
  }

  function paintPattern() {
    const rule = currentRule();
    const isCustom = rule.key === CUSTOM;
    $("vxHint").textContent = rule.hint;
    $("vxPattern").value = isCustom ? state.custom.source : rule.pattern.source;
    $("vxFlags").value = isCustom ? state.custom.flags : "";
    $("vxPattern").readOnly = $("vxFlags").readOnly = !isCustom;
    $("vxPatternBar").classList.toggle("readonly", !isCustom);
    $("vxFullWrap").hidden = !isCustom;
    $("vxEditPattern").hidden = isCustom;
    $("vxPatternError").textContent = rule.error ? `regex ผิด: ${rule.error}` : "";
    $("vxPatternBar").classList.toggle("bad", Boolean(rule.error));
    const chips = [rule.pattern.note, ...rule.checks].filter(Boolean).map((c, i) => el("span", { className: "chip" + (i === 0 && rule.pattern.note ? " note" : ""), textContent: (i === 0 && rule.pattern.note ? "" : "+ ") + c }));
    $("vxChecks").replaceChildren(...chips);
  }

  function run() {
    const rule = currentRule();
    state.entries = testLines(rule, input.value, MAX_LINES);
    const lines = input.value.split("\n").length;
    $("vxLimit").textContent = lines > MAX_LINES ? `ตรวจ ${fmt(MAX_LINES)} บรรทัดแรกจาก ${fmt(lines)}` : "";
    if (state.selected > state.entries.length) state.selected = state.entries.length;
    paintHighlight();
    paintSummary();
    paintResults();
    paintSelection();
  }

  // Backdrop behind the transparent textarea: one block per line, matches wrapped in <mark>.
  function paintHighlight() {
    const hl = el("div", { className: "hl-inner" });
    const gutter = el("div", { className: "gutter-inner" });
    state.entries.forEach(({ line, n, result }) => {
      const row = el("div", { className: "hl-line" });
      row.dataset.n = n;
      const status = result ? (result.ok ? "ok" : "bad") : "";
      if (status) row.classList.add(status);
      let at = 0;
      (result?.spans ?? []).forEach(([start, end]) => {
        if (start > at) row.append(line.slice(at, start));
        row.append(el("mark", { className: status, textContent: line.slice(start, end) }));
        at = end;
      });
      row.append(line.slice(at) || "​");
      hl.append(row);
      const g = el("div", { className: "g-line " + status, textContent: String(n) });
      g.dataset.n = n;
      gutter.append(g);
    });
    $("vxHl").replaceChildren(hl);
    $("vxGutter").replaceChildren(gutter);
    syncScroll();
  }

  function paintSummary() {
    const tested = state.entries.filter((e) => e.result);
    const ok = tested.filter((e) => e.result.ok).length;
    const counts = { all: tested.length, ok, bad: tested.length - ok };
    $("vxSummary").replaceChildren(
      el("span", { textContent: `${fmt(counts.all)} ค่า` }),
      el("span", { className: "st ok", textContent: `ผ่าน ${fmt(counts.ok)}` }),
      el("span", { className: "st bad", textContent: `ไม่ผ่าน ${fmt(counts.bad)}` }),
    );
    const choices = Object.entries(FILTERS).map(([k, label]) => [k, `${label} ${fmt(counts[k])}`]);
    const seg = segmented("vxFilter", choices, state.filter, (val) => { state.filter = val; paintResults(); paintSelection(); }, { ariaLabel: "กรองผลลัพธ์" });
    seg.querySelectorAll("label").forEach((l) => { l.dataset.case = { ok: "valid", bad: "invalid" }[l.htmlFor.split("-").pop()] ?? ""; });
    replaceKeepingFocus($("vxFilter"), seg);
  }

  const visibleEntries = () => state.entries.filter((e) => e.result && (state.filter === "all" || (state.filter === "ok") === e.result.ok));

  function paintResults() {
    const items = visibleEntries().map(({ line, n, result }) => {
      const li = el("li", { className: "vx-row", tabIndex: 0 },
        el("span", { className: "num", textContent: String(n) }),
        el("span", { className: "val", textContent: line.trim(), title: line.trim() }),
        el("span", { className: "st " + (result.ok ? "ok" : "bad"), textContent: result.reason, title: result.reason }));
      li.dataset.n = n;
      return li;
    });
    $("vxList").replaceChildren(...items);
    $("vxEmpty").hidden = items.length > 0;
    $("vxEmpty").textContent = state.entries.some((e) => e.result) ? "ไม่มีบรรทัดที่ตรงกับตัวกรอง" : "พิมพ์หรือวางค่าที่จะตรวจ บรรทัดละ 1 ค่า";
  }

  function paintSelection() {
    const n = String(state.selected);
    document.querySelectorAll("#vxHl .sel, #vxGutter .sel, #vxList .sel").forEach((x) => x.classList.remove("sel"));
    document.querySelectorAll(`#vxHl [data-n="${n}"], #vxGutter [data-n="${n}"], #vxList [data-n="${n}"]`).forEach((x) => x.classList.add("sel"));
    const entry = state.entries[state.selected - 1];
    const detail = $("vxDetail");
    if (!entry?.result) {
      detail.replaceChildren(el("p", { className: "detail-empty", textContent: "คลิกบรรทัดใดก็ได้เพื่อดูว่าทำไมถึงผ่านหรือไม่ผ่าน" }));
      return;
    }
    detail.replaceChildren(...explain(currentRule().key, entry));
  }

  // Keep the backdrop and gutter aligned with the textarea's scroll position.
  function syncScroll() {
    const inner = $("vxHl").firstChild;
    if (inner) inner.style.transform = `translate(${-input.scrollLeft}px, ${-input.scrollTop}px)`;
    const g = $("vxGutter").firstChild;
    if (g) g.style.transform = `translateY(${-input.scrollTop}px)`;
  }

  function selectFromCaret() {
    const n = input.value.slice(0, input.selectionStart).split("\n").length;
    if (n !== state.selected) { state.selected = n; paintSelection(); }
  }

  function selectLine(n) {
    state.selected = n;
    const lineH = parseFloat(getComputedStyle(input).lineHeight) || 24;
    input.scrollTop = Math.max(0, (n - 3) * lineH);
    paintSelection();
  }

  const runLater = debounce(run, 150);
  input.addEventListener("input", () => {
    state.texts.set(state.ruleKey, input.value);
    if (state.entries.length > LIVE_LINES) runLater(); else run();
  });
  input.addEventListener("scroll", syncScroll, { passive: true });
  ["click", "keyup", "select"].forEach((ev) => input.addEventListener(ev, selectFromCaret));
  $("vxList").addEventListener("click", (e) => { const li = e.target.closest(".vx-row"); if (li) selectLine(Number(li.dataset.n)); });
  $("vxList").addEventListener("keydown", (e) => {
    const li = e.target.closest(".vx-row");
    if (li && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); selectLine(Number(li.dataset.n)); }
  });
  $("vxGutter").addEventListener("click", (e) => { const g = e.target.closest(".g-line"); if (g) selectLine(Number(g.dataset.n)); });

  // Custom pattern controls.
  const onPattern = () => {
    state.custom = { source: $("vxPattern").value, flags: $("vxFlags").value.trim(), fullMatch: $("vxFull").checked };
    paintPattern();
    run();
  };
  ["vxPattern", "vxFlags"].forEach((id) => $(id).addEventListener("input", () => { if (state.ruleKey === CUSTOM) onPattern(); }));
  $("vxFull").addEventListener("change", onPattern);
  $("vxEditPattern").addEventListener("click", () => {
    // Start a custom regex from this rule's shape, keeping the values being tested.
    const { source } = currentRule().pattern;
    state.custom = { source: source.replace(/^\^|\$$/g, ""), flags: "", fullMatch: true };
    $("vxFull").checked = true;
    state.texts.set(CUSTOM, input.value);
    switchRule(CUSTOM);
  });

  $("vxSample").addEventListener("click", () => { input.value = sampleText(currentRule()); state.texts.set(state.ruleKey, input.value); state.selected = 1; run(); });
  $("vxClear").addEventListener("click", () => { input.value = ""; state.texts.set(state.ruleKey, ""); input.focus(); run(); });
  const copyWhere = (ok, label) => () => {
    const values = state.entries.filter((e) => e.result && e.result.ok === ok).map((e) => e.line.trim());
    copy(values.join("\n"), `Copied ${fmt(values.length)} ${label}`);
  };
  $("vxCopyOk").addEventListener("click", copyWhere(true, "ค่าที่ผ่าน"));
  $("vxCopyBad").addEventListener("click", copyWhere(false, "ค่าที่ไม่ผ่าน"));

  $("vxFull").checked = state.custom.fullMatch;
  state.texts.set(state.ruleKey, sampleText(currentRule()));
  input.value = state.texts.get(state.ruleKey);
  paintTabs();
  paintPattern();
  run();
}
