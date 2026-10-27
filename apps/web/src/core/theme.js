// Light/dark toggle; an explicit choice is remembered, otherwise the OS setting wins.
import { $ } from "./dom.js";

const root = document.documentElement;
const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
// The button shows the mode you switch to.
const paint = () => { document.querySelector(".theme-label").textContent = isDark() ? "Light mode" : "Dark mode"; };

export function initTheme() {
  try { const saved = localStorage.getItem("theme"); if (saved) root.dataset.theme = saved; } catch {}
  $("themeBtn").addEventListener("click", () => {
    root.dataset.theme = isDark() ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
    paint();
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paint);
  paint();
}
