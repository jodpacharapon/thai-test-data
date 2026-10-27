// Hash routing between the top-level views (#generate, #validate, #docs, #report).
import { $ } from "./dom.js";

const VIEWS = ["generate", "validate", "docs", "report"];
const listeners = [];

/** Call `fn(viewName)` whenever a view is shown, including the first one. */
export const onViewShown = (fn) => listeners.push(fn);

function show() {
  const name = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "generate";
  VIEWS.forEach((v) => { $("view-" + v).hidden = v !== name; });
  document.querySelectorAll(".tabs a").forEach((a) => {
    if (a.dataset.view === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  listeners.forEach((fn) => fn(name));
}

export function initViews() {
  addEventListener("hashchange", () => { show(); scrollTo(0, 0); });
  show();
}
