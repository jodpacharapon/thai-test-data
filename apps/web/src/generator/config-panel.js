// Settings panel for the selected type, built from its `controls` declaration.
import { $, el, infoButton, segmented } from "../core/dom.js";
import { HELP } from "./types.js";

/**
 * Render the controls of `type` for settings `o`. Every change updates `o` and calls
 * `onChange`; a segmented change re-renders first because it can show or hide other controls.
 */
export function renderConfig(type, o, onChange) {
  const box = $("config");
  box.replaceChildren();
  const rerender = () => { renderConfig(type, o, onChange); onChange(); };
  type.controls.forEach((c) => {
    if (c.when && !c.when(o)) return;
    const help = c.help ?? HELP[c.id];
    const legend = el("legend", {}, c.label);
    if (help) legend.append(infoButton(c.label, help));
    const group = el("fieldset", { className: "cfg cfg-" + c.kind }, legend);
    const name = `${type.key}-${c.id}`;
    group.append(...controlFor(c, name, o, { onChange, rerender }));
    box.append(group);
  });
  box.hidden = box.childElementCount === 0;
}

function controlFor(c, name, o, { onChange, rerender }) {
  if (c.kind === "seg") {
    const seg = segmented(name, c.choices, o[c.id], (val) => { o[c.id] = val; rerender(); });
    if (c.id === "case") seg.querySelectorAll("label").forEach((l) => { l.dataset.case = l.htmlFor.split("-").pop(); });
    return [seg];
  }
  if (c.kind === "checks") {
    const list = el("div", { className: "checks" });
    c.choices.forEach(([val, label]) => {
      const input = el("input", { type: "checkbox", id: `${name}-${val}`, value: val, checked: o[c.id].includes(val) });
      input.addEventListener("change", () => {
        o[c.id] = [...list.querySelectorAll("input:checked")].map((x) => x.value);
        onChange();
      });
      list.append(el("label", { className: "check", htmlFor: input.id }, input, label));
    });
    return c.id === "bad" ? [list, el("small", { className: "cfg-hint", textContent: "ไม่เลือกเลย = ได้แต่ valid data" })] : [list];
  }
  if (c.kind === "select") {
    const sel = el("select", { id: name });
    c.choices.forEach(([val, label]) => sel.append(el("option", { value: val, textContent: label, selected: o[c.id] === val })));
    sel.addEventListener("change", () => { o[c.id] = sel.value; onChange(); });
    return [sel];
  }
  const input = el("input", { type: "number", id: name, min: c.min, max: c.max, value: o[c.id] });
  input.addEventListener("change", () => {
    o[c.id] = Math.min(c.max, Math.max(c.min, Number(input.value) || 0));
    input.value = o[c.id];
    onChange();
  });
  return [input];
}
