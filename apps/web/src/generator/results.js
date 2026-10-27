// The result sheet: filters (search, status, reason), page size + pager, export buttons,
// and the virtualized list or table of rows.
import { $, el, fmt, copy, debounce, download, replaceKeepingFocus, segmented, toast } from "../core/dom.js";
import { columnsOf, hasCase, isTable, statusText } from "./rows.js";
import { filterRows, paginate } from "./filter.js";
import { toCsv, toJson, toText } from "./export.js";
import { createVirtualList } from "./virtual-list.js";

const PAGE_SIZES = [["50", "50"], ["100", "100"], ["1000", "1,000"], ["50000", "50,000"], ["all", "ทั้งหมด"]];
const STATUS_LABEL = { all: "ทั้งหมด", valid: "Valid", invalid: "Invalid" };
const COPIED_MS = 1200;

const spacerHeight = (node) => (h) => { node.style.height = `${h}px`; };

/** @param {{ fileName: () => string }} opts */
export function createResults({ fileName }) {
  let rows = [];
  let view = { indices: [], counts: { all: 0, valid: 0, invalid: 0 }, reasons: [] };
  const f = { query: "", isRegex: false, status: "all", reason: "all", pageSize: 100, page: 0 };

  // Two bodies, one per layout; only the one in use is attached to the scroller.
  const scroller = $("resultScroll");
  const list = el("ol", { className: "rows" });
  const table = el("table");
  const thead = table.createTHead();
  const tbody = table.createTBody();
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
    if (isTable(rows)) {
      const cols = columnsOf(rows);
      const head = el("tr");
      ["#", ...cols, ...(hasCase(rows) ? ["Expected"] : [])].forEach((c) => head.append(el("th", { textContent: c })));
      thead.replaceChildren(head);
      if (scroller.firstChild !== table) scroller.replaceChildren(table);
      listView.detach();
      tableView.set(items, (i) => tableRow(rows[i], i, cols));
    } else {
      if (scroller.firstChild !== list) scroller.replaceChildren(list);
      tableView.detach();
      listView.set(items, (i) => listRow(rows[i], i));
    }
    $("pager").hidden = pages <= 1;
    $("pageInfo").textContent = `หน้า ${fmt(page + 1)} / ${fmt(pages)}`;
    $("pagePrev").disabled = page === 0;
    $("pageNext").disabled = page >= pages - 1;
    paintFoot(from, items.length);
  }

  function paintFoot(from, shown) {
    const n = view.indices.length;
    const parts = [isFiltered() ? `ตรงตัวกรอง ${fmt(n)} จาก ${fmt(rows.length)} rows` : `${fmt(rows.length)} rows`];
    if (shown && shown < n) parts.push(`แสดงแถว ${fmt(from + 1)}–${fmt(from + shown)}`);
    if (isFiltered()) parts.push("Copy all / JSON / CSV จะ export เฉพาะแถวที่ตรงตัวกรอง");
    else parts.push(isTable(rows) ? "ใช้ปุ่ม JSON หรือ CSV เพื่อ export ทั้งตาราง" : "คลิกแถวเพื่อ copy");
    $("sheetFoot").textContent = parts.join(" · ");
  }

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
    li.append(el("span", { className: "num", textContent: fmt(i + 1) }), val, st, el("span", { className: "hint", textContent: "Copy" }));
    return li;
  }

  function tableRow(r, i, cols) {
    const tr = el("tr", {}, el("td", { textContent: fmt(i + 1) }));
    cols.forEach((c) => {
      const td = el("td", { textContent: r.value[c], title: r.value[c] });
      if (/^[\d+\-/]+$/.test(String(r.value[c]))) td.className = "mono";
      tr.append(td);
    });
    if (hasCase(rows)) tr.append(el("td", {}, el("span", { className: "st " + (r.ok ? "ok" : "bad"), textContent: statusText(r) })));
    return tr;
  }

  async function copyRow(li) {
    const r = rows[Number(li.dataset.i)];
    if (!r || !(await copy(r.value, "Copied"))) return;
    const hint = li.querySelector(".hint");
    li.classList.add("copied");
    hint.textContent = "✓";
    setTimeout(() => { li.classList.remove("copied"); hint.textContent = "Copy"; }, COPIED_MS);
  }
  list.addEventListener("click", (e) => { const li = e.target.closest(".row"); if (li) copyRow(li); });
  list.addEventListener("keydown", (e) => {
    const li = e.target.closest(".row");
    if (li && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); copyRow(li); }
  });

  // Filter controls.
  $("rq").addEventListener("input", debounce((e) => { f.query = e.target.value; apply(); }));
  $("rqRegex").addEventListener("click", (e) => {
    f.isRegex = !f.isRegex;
    e.currentTarget.setAttribute("aria-pressed", String(f.isRegex));
    $("rq").placeholder = f.isRegex ? "regex เช่น ^1\\d{12}$" : "ค้นหาในผลลัพธ์";
    apply();
  });
  $("reasonFilter").addEventListener("change", (e) => { f.reason = e.target.value; apply(); });
  const pageSize = segmented("pageSize", PAGE_SIZES, String(f.pageSize), (val) => {
    f.pageSize = val === "all" ? Infinity : Number(val);
    apply();
  }, { ariaLabel: "จำนวนแถวต่อหน้า" });
  pageSize.id = "pageSize";
  $("pageSize").replaceWith(pageSize);
  $("pagePrev").addEventListener("click", () => { f.page--; paintRows(); });
  $("pageNext").addEventListener("click", () => { f.page++; paintRows(); });

  // Exports follow the filters. With nothing matched, say so instead of copying an empty string over the clipboard.
  const withMatched = (fn) => () => {
    const m = matched();
    if (m.length === 0) toast("ไม่มีแถวที่ตรงตัวกรองให้ export");
    else fn(m);
  };
  $("copyAll").addEventListener("click", withMatched((m) => copy(toText(m), `Copied ${fmt(m.length)} rows`)));
  $("copyJson").addEventListener("click", withMatched((m) => copy(toJson(m), "Copied JSON")));
  $("dlCsv").addEventListener("click", withMatched((m) => download(fileName(), toCsv(m))));

  return {
    /** Show a new set of rows, keeping the current filters. */
    setRows(next) { rows = next; apply(); },
    rows: () => rows,
  };
}
