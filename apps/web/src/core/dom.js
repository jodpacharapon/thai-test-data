// Small DOM and formatting helpers shared by every view.

export const $ = (id) => document.getElementById(id);

/**
 * Create an element with properties and children, e.g. el("li", { className: "row" }, "text").
 * @param {string} tag
 * @param {Record<string, unknown>} [props]
 * @param {...(Node|string)} children
 */
export function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

export const fmt = (n) => n.toLocaleString("en-US");

/** Run `fn` once input has been quiet for `ms`, so typing in a filter doesn't re-render on every key. */
export function debounce(fn, ms = 120) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

let toastTimer;
export function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1400);
}

export async function copy(text, done = "คัดลอกแล้ว") {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
    return true;
  } catch {
    toast("คัดลอกไม่สำเร็จ ลองเลือกข้อความแล้วกด Ctrl+C");
    return false;
  }
}

export function download(filename, text, type = "text/csv;charset=utf-8") {
  const a = el("a", { href: URL.createObjectURL(new Blob(["\uFEFF" + text], { type })), download: filename });
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Info button that shows `tip` as a tooltip (see core/tooltips.js). */
export const infoButton = (label, tip) => {
  const b = el("button", { type: "button", className: "info", textContent: "i" });
  b.setAttribute("aria-label", `${label} คืออะไร`);
  b.dataset.tip = tip;
  return b;
};

/**
 * Replace a container's content, then put keyboard focus back on the element with the
 * same id, so rebuilding a control (e.g. a radio group with new counts) doesn't drop focus.
 */
export function replaceKeepingFocus(container, ...nodes) {
  const focusedId = container.contains(document.activeElement) ? document.activeElement.id : "";
  container.replaceChildren(...nodes);
  if (focusedId) document.getElementById(focusedId)?.focus();
}

/**
 * Segmented radio control. `choices` is [[value, label], ...].
 * @returns {HTMLDivElement}
 */
export function segmented(name, choices, selected, onChange, { ariaLabel } = {}) {
  const seg = el("div", { className: "seg" });
  seg.setAttribute("role", "radiogroup");
  if (ariaLabel) seg.setAttribute("aria-label", ariaLabel);
  choices.forEach(([val, label]) => {
    const id = `${name}-${val}`;
    const input = el("input", { type: "radio", name, id, value: val, checked: selected === val });
    input.addEventListener("change", () => onChange(val));
    seg.append(input, el("label", { htmlFor: id, textContent: label }));
  });
  return seg;
}
