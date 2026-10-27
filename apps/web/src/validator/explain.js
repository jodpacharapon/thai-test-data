// "Why" panel for the selected line: the working behind a rule's verdict, like a regex tester's match info.
import { formatPhone, toE164 } from "../../lib/index.js";
import { el } from "../core/dom.js";

const BE_OFFSET = 543;
const MS_PER_YEAR = 365.2425 * 24 * 3600 * 1000;

const kv = (pairs) => el("dl", { className: "kv" }, ...pairs.flatMap(([k, v]) => [el("dt", { textContent: k }), el("dd", { textContent: v })]));

function table(headers, rows) {
  const t = el("table");
  const head = t.createTHead().insertRow();
  headers.forEach((h) => head.append(el("th", { textContent: h })));
  const body = t.createTBody();
  rows.forEach((cells) => { const tr = body.insertRow(); cells.forEach((c) => { tr.insertCell().textContent = c; }); });
  return el("div", { className: "table-wrap explain-table" }, t);
}

/** Digit-by-digit working of the Thai ID check digit. */
function checkDigitWorking(d) {
  const grid = el("div", { className: "calc-grid" });
  const cell = (text, cls = "") => grid.append(el("div", { className: cls, textContent: text }));
  const rows = [
    ["หลัก", (i) => (i < 12 ? d[i] : d[12] ?? "?")],
    ["× ตัวคูณ", (i) => (i < 12 ? 13 - i : "")],
    ["ผลคูณ", (i) => (i < 12 ? Number(d[i]) * (13 - i) : "")],
  ];
  rows.forEach(([label, fn], r) => {
    const last = r === rows.length - 1 ? " last" : "";
    cell(label, "lbl" + last);
    for (let i = 0; i < 13; i++) cell(String(fn(i)), (i === 12 ? "chk" : "") + last);
  });
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d[i]) * (13 - i);
  const mod = sum % 11;
  const check = (11 - mod) % 10;
  const steps = el("p", { className: "calc-steps" });
  [[`sum = `, sum], [`${sum} mod 11 = `, mod], [`check digit = (11 − ${mod}) mod 10 = `, check]].forEach(([text, b], i) => {
    if (i) steps.append(el("br"));
    steps.append(text, el("b", { textContent: String(b) }));
  });
  return [el("h3", { textContent: "วิธีคำนวณ check digit" }), grid, steps];
}

const EXPLAIN = {
  thaiId: ({ data }) => (data?.digits && /^\d{12,}$/.test(data.digits) ? checkDigitWorking(data.digits.slice(0, 13)) : []),
  phone: ({ ok, data }) => (ok ? [kv([["ตัวเลขล้วน", data.local], ["มีขีด", formatPhone(data.local)], ["E.164", toE164(data.local)]])] : []),
  postal: ({ data }) => (data?.areas?.length ? [table(["ตำบล/แขวง", "อำเภอ/เขต", "จังหวัด"], data.areas.map((a) => [a.subdistrict, a.district, a.province]))] : []),
  email: ({ ok, data }) => (ok ? [kv([["ชื่อ (local part)", data.local], ["โดเมน", data.domain]])] : []),
  thaiDate: ({ ok, data }) => {
    if (!ok) return [];
    const d = data.date;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const age = Math.floor((Date.now() - d.getTime()) / MS_PER_YEAR);
    return [kv([["ค.ศ. (ISO)", iso], ["พ.ศ.", String(d.getFullYear() + BE_OFFSET)], ["อายุ ณ วันนี้", age >= 0 ? `${age} ปี` : "อยู่ในอนาคต"]])];
  },
  custom: ({ data }) => {
    if (!data?.matches?.length) return [];
    const groupCount = Math.max(0, ...data.matches.map((m) => m.groups.length));
    const headers = ["#", "ส่วนที่ตรง", "ตำแหน่ง", ...Array.from({ length: groupCount }, (_, i) => `$${i + 1}`)];
    return [table(headers, data.matches.map((m, i) => [String(i + 1), m.text, `${m.start}–${m.end}`, ...m.groups.map((g) => g ?? "—")]))];
  },
};

/** Content for the detail panel of one tested line. */
export function explain(ruleKey, entry) {
  const { result } = entry;
  const head = el("div", { className: "detail-head" },
    el("span", { className: "detail-line", textContent: `บรรทัด ${entry.n}` }),
    el("code", { textContent: entry.line.trim() }),
    el("span", { className: "st " + (result.ok ? "ok" : "bad"), textContent: result.ok ? "ผ่าน" : "ไม่ผ่าน" }));
  return [head, el("p", { className: "detail-reason", textContent: result.reason }), ...(EXPLAIN[ruleKey]?.(result) ?? [])];
}
