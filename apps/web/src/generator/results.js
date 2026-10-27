// The result sheet: filters (search, status, reason), page size + pager, export buttons,
// and the virtualized rows: a list for single values, and for types with several fields a table
// when it fits the width, or one card per row when it doesn't, so nothing needs sideways scrolling.
import { $, el, fmt, copy, debounce, download, replaceKeepingFocus, segmented, toast } from "../core/dom.js";
import { columnsOf, hasCase, isTable, statusText } from "./rows.js";
import { filterRows, paginate } from "./filter.js";
import { rowToJson, toCsv, toJson, toText } from "./export.js";
import { createVirtualList } from "./virtual-list.js";
import { columnWidths } from "./column-widths.js";

const PAGE_SIZES = [["50", "50"], ["100", "100"], ["1000", "1,000"], ["50000", "50,000"], ["all", "ทั้งหมด"]];
const STATUS_LABEL = { all: "ทั้งหมด", valid: "Valid", invalid: "Invalid" };
const COPIED_MS = 1200;
// Table cells: 14px padding each side + 1px border + a little slack for font rendering.
const CELL_PADDING_PX = 34;
const STATUS_CHIP_PX = 16;
// Font size of table cells and card values (table in base.css, .rec-v in generator.css).
const CELL_FONT_REM = 0.92;
// Last table column, holding the copy-row button (matches .copy-row in generator.css).
const COPY_COL_PX = 48;
const COPY_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">'
  + '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const MONO_CELL = /^[\d+\-/]+$/;
// The # column: a mono digit at 0.78rem is about 0.47rem wide, plus padding (matches --num-w in CSS).
const NUM_MIN_PX = 44;
const NUM_DIGIT_REM = 0.47;
const NUM_PADDING_PX = 26;
const DEFAULT_FILTERS = Object.freeze({ query: "", isRegex: false, status: "all", reason: "all", pageSize: 100, page: 0 });

const spacerHeight = (node) => (h) => { node.style.height = `${h}px`; };

/** @param {{ fileName: () => string }} opts */
export function createResults({ fileName }) {
  let rows = [];
  let view = { indices: [], counts: { all: 0, valid: 0, invalid: 0 }, reasons: [] };
  const f = { ...DEFAULT_FILTERS };

  // Two bodies, one per layout; only the one in use is attached to the scroller.
  const scroller = $("resultScroll");
  const list = el("ol", { className: "rows" });
  const table = el("table");
  const thead = table.createTHead();
  const tbody = table.createTBody();
  let layout = "list"; // "list" | "table" | "cards"
  const listView = createVirtualList({
    scroller,
    body: list,
    makeSpacer: () => {
      const node = el("li", { className: "spacer", ariaHidden: "true" });
      return { node, setHeight: spacerHeight(node) };
    },
  });
  const tableView = createVirtualList({
    scroller,
    body: tbody,
    makeSpacer: () => {
      const td = el("td", { colSpan: 99 });
      return { node: el("tr", { className: "spacer", ariaHidden: "true" }, td), setHeight: spacerHeight(td) };
    },
  });

  const matched = () => view.indices.map((i) => rows[i]);
  const isFiltered = () => f.query.trim() !== "" || f.status !== "all" || f.reason !== "all";

  function apply() {
    // Drop filters whose controls are about to be hidden, so nothing invisible stays applied.
    if (!hasCase(rows)) f.status = "all";
    if (f.status === "valid") f.reason = "all";
    view = filterRows(rows, f);
    if (f.reason !== "all" && !view.reasons.some(([r]) => r === f.reason)) {
      f.reason = "all";
      view = filterRows(rows, f);
    }
    f.page = 0;
    // The clear button appears once anything differs from the defaults, including page size.
    $("clearFilters").hidden = !isFiltered() && !f.isRegex && f.pageSize === DEFAULT_FILTERS.pageSize;
    $("rqError").textContent = view.error ? `regex ผิด: ${view.error}` : "";
    $("rq").classList.toggle("bad", Boolean(view.error));
    paintStatus();
    paintReasons();
    paintRows();
  }

  function paintStatus() {
    const box = $("statusFilter");
    box.hidden = !hasCase(rows);
    if (box.hidden) return;
    const choices = Object.keys(STATUS_LABEL).map((k) => [k, `${STATUS_LABEL[k]} ${fmt(view.counts[k])}`]);
    const seg = segmented("status", choices, f.status, (val) => { f.status = val; apply(); }, { ariaLabel: "กรองตาม valid / invalid" });
    seg.querySelectorAll("label").forEach((l) => { l.dataset.case = l.htmlFor.split("-").pop(); });
    replaceKeepingFocus(box, seg);
  }

  function paintReasons() {
    const sel = $("reasonFilter");
    // Stay visible while a reason is chosen, so it can always be cleared.
    sel.hidden = f.reason === "all" && (view.reasons.length < 2 || f.status === "valid");
    sel.replaceChildren(
      el("option", { value: "all", textContent: "ทุกสาเหตุที่ invalid" }),
      ...view.reasons.map(([r, n]) => el("option", { value: r, textContent: `${r} (${fmt(n)})`, selected: r === f.reason })),
    );
  }

  function paintRows() {
    const { page, pages, from, items } = paginate(view.indices, f.page, f.pageSize);
    f.page = page;
    $("resultEmpty").hidden = items.length > 0 || rows.length === 0;
    // Size the # column for the longest row number (e.g. "100,000"), so every row lines up and nothing is clipped.
    scroller.style.setProperty("--num-chars", String(fmt(rows.length).length));
    layout = layoutFor();
    list.classList.toggle("cards", layout === "cards");
    if (layout === "table") {
      const cols = columnsOf(rows);
      const head = el("tr");
      ["#", ...headersOf(cols)].forEach((c) => head.append(el("th", { textContent: c })));
      const copyHead = el("th");
      copyHead.setAttribute("aria-label", "คัดลอกทั้งแถว");
      head.append(copyHead);
      thead.replaceChildren(head);
      if (scroller.firstChild !== table) scroller.replaceChildren(table);
      applyColumnWidths();
      listView.detach();
      tableView.set(items, (i) => tableRow(rows[i], i, cols));
    } else {
      if (scroller.firstChild !== list) scroller.replaceChildren(list);
      tableView.detach();
      if (layout === "cards") {
        const cols = columnsOf(rows);
        const headers = headersOf(cols);
        listView.set(items, (i) => cardRow(rows[i], i, cols, headers));
      } else {
        listView.set(items, (i) => listRow(rows[i], i));
      }
    }
    $("pager").hidden = pages <= 1;
    $("pageInfo").textContent = `หน้า ${fmt(page + 1)} / ${fmt(pages)}`;
    $("pagePrev").disabled = page === 0;
    $("pageNext").disabled = page >= pages - 1;
    paintFoot(from, items.length);
  }

  function paintFoot(from, shown) {
    const n = view.indices.length;
    const parts = [isFiltered() ? `ตรงตัวกรอง ${fmt(n)} จาก ${fmt(rows.length)} แถว` : `${fmt(rows.length)} แถว`];
    if (shown && shown < n) parts.push(`แสดงแถว ${fmt(from + 1)}–${fmt(from + shown)}`);
    if (isFiltered()) parts.push("คัดลอกทั้งหมด, JSON และ CSV จะได้เฉพาะแถวที่ตรงตัวกรอง");
    else parts.push(isTable(rows) ? "คลิกช่องเพื่อคัดลอกค่าเดียว หรือกดปุ่มคัดลอกท้ายแถวเพื่อคัดลอกทั้งแถว" : "คลิกแถวเพื่อคัดลอก");
    $("sheetFoot").textContent = parts.join(" · ");
  }

  const headersOf = (cols) => [...cols, ...(hasCase(rows) ? ["ผลที่ควรได้"] : [])];

  // Table when every column fits at full width; otherwise cards, which wrap instead of scrolling sideways.
  function layoutFor() {
    if (!isTable(rows)) return "list";
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const numW = Math.max(NUM_MIN_PX, fmt(rows.length).length * NUM_DIGIT_REM * rem + NUM_PADDING_PX);
    const tableW = numW + widthsFor().reduce((a, b) => a + b, 0) + COPY_COL_PX;
    return tableW <= scroller.clientWidth ? "table" : "cards";
  }

  // Column widths from the longest value in each column (over all rows, not just the ones on
  // screen), so full values show and columns stay put while scrolling. Cards use them too, as the
  // starting width of each field.
  let sizedFor = null;
  let widths = [];
  let measureCtx = null;
  function widthsFor() {
    if (sizedFor === rows) return widths;
    sizedFor = rows;
    const cols = columnsOf(rows);
    const headers = headersOf(cols);
    measureCtx ??= document.createElement("canvas").getContext("2d");
    // Read fonts from the root, not from a cell: the table may not be on the page yet (cards chosen first).
    const root = getComputedStyle(document.documentElement);
    const size = `${CELL_FONT_REM * parseFloat(root.fontSize)}px`;
    const body = root.getPropertyValue("--font-body");
    const mono = root.getPropertyValue("--font-mono");
    const measure = (text) => {
      measureCtx.font = `${size} ${MONO_CELL.test(text) ? mono : body}`;
      return measureCtx.measureText(text).width;
    };
    const columns = cols.map((c, k) => ({ header: headers[k], texts: rows.map((r) => String(r.value[c])) }));
    if (hasCase(rows)) columns.push({ header: headers.at(-1), texts: rows.map(statusText), extra: STATUS_CHIP_PX });
    widths = columnWidths(columns, measure, CELL_PADDING_PX).map((w, k) => w + (columns[k].extra ?? 0));
    return widths;
  }

  function applyColumnWidths() {
    const colgroup = el("colgroup", {}, el("col", { style: "width: var(--num-w)" }), ...widths.map((w) => el("col", { style: `width: ${w}px` })),
      el("col", { style: `width: ${COPY_COL_PX}px` }));
    table.querySelector("colgroup")?.remove();
    table.prepend(colgroup);
    table.style.width = `calc(var(--num-w) + ${widths.reduce((a, b) => a + b, 0) + COPY_COL_PX}px)`;
  }

  // Widths measured before the web fonts arrive would be for the fallback font; measure again once they load.
  document.fonts?.ready.then(() => { if (isTable(rows)) { sizedFor = null; paintRows(); } });
  // Switch between table and cards when the width changes (rotating a phone, resizing the window).
  new ResizeObserver(() => { if (isTable(rows) && layoutFor() !== layout) paintRows(); }).observe(scroller);

  // Row builders. data-i is the index into `rows`, read by the delegated click handler.
  function listRow(r, i) {
    const v = r.value;
    const li = el("li", { className: "row", tabIndex: 0 });
    li.dataset.i = i;
    const val = el("span", { className: "val", textContent: v.trim() === "" ? `"${v}"` : v, title: v });
    if ((/[ก-๙]/.test(v) && !/^\d/.test(v)) || /, /.test(v)) val.classList.add("text");
    const st = el("span", { className: "st" });
    if (r.ok !== undefined) {
      st.classList.add(r.ok ? "ok" : "bad");
      st.textContent = statusText(r);
      if (r.ok && r.note) st.title = r.note;
    }
    li.append(el("span", { className: "num", textContent: fmt(i + 1) }), val, st, el("span", { className: "hint", textContent: "คัดลอก" }));
    return li;
  }

  function tableRow(r, i, cols) {
    const tr = el("tr", {}, el("td", { textContent: fmt(i + 1) }));
    tr.dataset.i = i;
    cols.forEach((c) => {
      const td = el("td", { textContent: r.value[c], title: r.value[c] });
      td.dataset.c = c;
      if (MONO_CELL.test(String(r.value[c]))) td.className = "mono";
      tr.append(td);
    });
    if (hasCase(rows)) tr.append(el("td", {}, el("span", { className: "st " + (r.ok ? "ok" : "bad"), textContent: statusText(r) })));
    tr.append(el("td", { className: "copy-cell" }, copyRowButton()));
    return tr;
  }

  // One card per row: each field is a label over its value. Fields start at their column's width and
  // wrap onto the next line when the card is full, so a long address gets a line of its own.
  function cardRow(r, i, cols, headers) {
    const li = el("li", { className: "record" });
    li.dataset.i = i;
    const fields = el("div", { className: "rec-fields" });
    cols.forEach((c, k) => {
      const v = String(r.value[c]);
      const field = el("div", { className: "rec-field", tabIndex: 0, title: "คลิกเพื่อคัดลอก" },
        el("span", { className: "rec-k", textContent: headers[k] }),
        el("span", { className: MONO_CELL.test(v) ? "rec-v mono" : "rec-v", textContent: v }));
      field.dataset.c = c;
      field.style.setProperty("--w", `${widths[k]}px`);
      fields.append(field);
    });
    if (hasCase(rows)) {
      fields.append(el("div", { className: "rec-field" },
        el("span", { className: "rec-k", textContent: headers.at(-1) }),
        el("span", { className: "st " + (r.ok ? "ok" : "bad"), textContent: statusText(r) })));
    }
    li.append(el("span", { className: "num", textContent: fmt(i + 1) }), fields, copyRowButton());
    return li;
  }

  function copyRowButton() {
    const b = el("button", { type: "button", className: "copy-row", title: "คัดลอกทั้งแถวเป็น JSON", innerHTML: COPY_ICON });
    b.setAttribute("aria-label", "คัดลอกทั้งแถว");
    return b;
  }

  // The copy-row button copies every field of its row as one JSON object.
  async function copyWholeRow(button) {
    const r = rows[Number(button.closest("[data-i]")?.dataset.i)];
    if (!r || !(await copy(rowToJson(r), "คัดลอกทั้งแถวแล้ว (JSON)"))) return;
    button.classList.add("copied");
    setTimeout(() => button.classList.remove("copied"), COPIED_MS);
  }

  // Click a table cell or card field to copy that one value.
  async function copyField(node) {
    const r = rows[Number(node.closest("[data-i]")?.dataset.i)];
    if (!r || !(await copy(String(r.value[node.dataset.c]), "คัดลอกแล้ว"))) return;
    node.classList.add("copied");
    setTimeout(() => node.classList.remove("copied"), COPIED_MS);
  }

  async function copyRow(li) {
    const r = rows[Number(li.dataset.i)];
    if (!r || !(await copy(r.value, "คัดลอกแล้ว"))) return;
    const hint = li.querySelector(".hint");
    li.classList.add("copied");
    hint.textContent = "✓";
    setTimeout(() => { li.classList.remove("copied"); hint.textContent = "คัดลอก"; }, COPIED_MS);
  }
  const target = (e) => e.target.closest(".copy-row, .rec-field[data-c], td[data-c], .row");
  const activate = (node) => {
    if (node.classList.contains("copy-row")) copyWholeRow(node);
    else if (node.classList.contains("row")) copyRow(node);
    else copyField(node);
  };
  scroller.addEventListener("click", (e) => { const node = target(e); if (node) activate(node); });
  scroller.addEventListener("keydown", (e) => {
    const node = target(e);
    // A button already fires click on Enter and Space.
    if (node && !node.classList.contains("copy-row") && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); activate(node); }
  });

  // Filter controls.
  const setRegex = (on) => {
    f.isRegex = on;
    $("rqRegex").setAttribute("aria-pressed", String(on));
    $("rq").placeholder = on ? "regex เช่น ^1\\d{12}$" : "ค้นหาในผลลัพธ์";
  };
  $("rq").addEventListener("input", debounce((e) => { f.query = e.target.value; apply(); }));
  $("rqRegex").addEventListener("click", () => { setRegex(!f.isRegex); apply(); });
  $("reasonFilter").addEventListener("change", (e) => { f.reason = e.target.value; apply(); });
  const pageSize = segmented("pageSize", PAGE_SIZES, String(f.pageSize), (val) => {
    f.pageSize = val === "all" ? Infinity : Number(val);
    apply();
  }, { ariaLabel: "จำนวนแถวต่อหน้า" });
  pageSize.id = "pageSize";
  $("pageSize").replaceWith(pageSize);
  $("clearFilters").addEventListener("click", () => {
    Object.assign(f, { ...DEFAULT_FILTERS });
    $("rq").value = "";
    setRegex(false);
    $(`pageSize-${DEFAULT_FILTERS.pageSize}`).checked = true;
    apply();
    $("rq").focus();
  });
  $("pagePrev").addEventListener("click", () => { f.page--; paintRows(); });
  $("pageNext").addEventListener("click", () => { f.page++; paintRows(); });

  // Exports follow the filters. With nothing matched, say so instead of copying an empty string over the clipboard.
  const withMatched = (fn) => () => {
    const m = matched();
    if (m.length === 0) toast("ไม่มีแถวที่ตรงตัวกรองให้ส่งออก");
    else fn(m);
  };
  $("copyAll").addEventListener("click", withMatched((m) => copy(toText(m), `คัดลอก ${fmt(m.length)} แถวแล้ว`)));
  $("copyJson").addEventListener("click", withMatched((m) => copy(toJson(m), "คัดลอก JSON แล้ว")));
  $("dlCsv").addEventListener("click", withMatched((m) => download(fileName(), toCsv(m))));

  return {
    /** Show a new set of rows, keeping the current filters. */
    setRows(next) { rows = next; apply(); },
    rows: () => rows,
  };
}
