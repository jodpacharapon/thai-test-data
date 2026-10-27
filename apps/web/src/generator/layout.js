// Room for the data: fold the type list into a thin rail (remembered), or show the result
// sheet full screen with only the data, filters and exports (Esc or the button again to leave).
import { $ } from "../core/dom.js";
import { onViewShown } from "../core/views.js";

const COLLAPSED_KEY = "typesCollapsed";

export function initLayout() {
  const workspace = $("workspace");
  const collapseBtn = $("collapseTypes");

  function setCollapsed(on) {
    workspace.classList.toggle("collapsed", on);
    collapseBtn.setAttribute("aria-expanded", String(!on));
    collapseBtn.title = on ? "แสดงรายการประเภทข้อมูล" : "พับรายการประเภทข้อมูล";
    collapseBtn.setAttribute("aria-label", collapseBtn.title);
    try { localStorage.setItem(COLLAPSED_KEY, on ? "1" : ""); } catch {}
  }
  let saved = false;
  try { saved = localStorage.getItem(COLLAPSED_KEY) === "1"; } catch {}
  setCollapsed(saved);
  collapseBtn.addEventListener("click", () => setCollapsed(!workspace.classList.contains("collapsed")));

  const sheet = $("sheet");
  const focusBtn = $("focusView");
  function setFocus(on) {
    sheet.classList.toggle("focus", on);
    document.body.classList.toggle("has-focus-sheet", on);
    focusBtn.setAttribute("aria-pressed", String(on));
    focusBtn.querySelector(".focus-label").textContent = on ? "ออกจากเต็มจอ" : "เต็มจอ";
  }
  focusBtn.addEventListener("click", () => setFocus(!sheet.classList.contains("focus")));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sheet.classList.contains("focus") && !e.defaultPrevented) setFocus(false);
  });
  // Leaving the Generator (another page in the app bar) closes full screen.
  onViewShown((view) => { if (view !== "generate") setFocus(false); });
}
