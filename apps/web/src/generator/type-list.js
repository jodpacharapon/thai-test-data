// The searchable list of data types on the left of the Generator.
import { $, el } from "../core/dom.js";
import { GROUPS, TYPES } from "./types.js";

/** Build the list; `onSelect(type)` runs on click or Enter in the search box. Returns a function that marks the selected type. */
export function initTypeList(onSelect) {
  const list = $("typeList");
  const entries = [];
  const groups = Object.entries(GROUPS).map(([key, label]) => {
    const heading = el("div", { className: "group-label", textContent: label });
    list.append(heading);
    const members = TYPES.filter((t) => t.group === key).map((t) => {
      const b = el("button", { type: "button", className: "type", textContent: t.title });
      b.setAttribute("role", "option");
      b.addEventListener("click", () => onSelect(t));
      list.append(b);
      const entry = { t, b, text: `${t.title} ${t.keys} ${label}`.toLowerCase() };
      entries.push(entry);
      return entry;
    });
    return { heading, members };
  });

  const noMatch = el("p", { className: "no-match", hidden: true });
  noMatch.innerHTML = 'ไม่พบ อยากให้มีเพิ่ม? <a href="https://github.com/jodpacharapon/thai-test-data/issues" target="_blank" rel="noopener">เปิด issue</a>';
  list.append(noMatch);

  $("q").addEventListener("input", (e) => {
    const terms = e.target.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    entries.forEach((x) => { x.b.hidden = !terms.every((t) => x.text.includes(t)); });
    groups.forEach((g) => { g.heading.hidden = g.members.every((m) => m.b.hidden); });
    noMatch.hidden = entries.some((x) => !x.b.hidden);
  });
  $("q").addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const first = entries.find((x) => !x.b.hidden);
    if (first) onSelect(first.t);
  });

  return (type) => entries.forEach((x) => x.b.setAttribute("aria-selected", String(x.t === type)));
}
