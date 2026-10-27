// Routing between the top-level pages (/, /validator, /docs, /report; see pages.js) with the
// History API, so each page has its own URL for search engines and sharing. Old #hash links
// (e.g. /#docs) are redirected to the matching path.
import { $ } from "./dom.js";
import { PAGES, SITE_URL, pageForPath } from "./pages.js";

const LEGACY_HASH = { generate: "generate", validate: "validate", docs: "docs", report: "report" };
const listeners = [];

/** Call `fn(viewName)` whenever a view is shown, including the first one. */
export const onViewShown = (fn) => listeners.push(fn);

function setMeta(name) {
  const page = PAGES[name];
  document.title = page.title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", page.description);
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", SITE_URL + page.path);
}

function show() {
  const name = pageForPath(location.pathname) ?? "generate";
  Object.keys(PAGES).forEach((v) => { $("view-" + v).hidden = v !== name; });
  document.querySelectorAll(".tabs a").forEach((a) => {
    if (a.dataset.view === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  setMeta(name);
  listeners.forEach((fn) => fn(name));
}

export function initViews() {
  const legacy = LEGACY_HASH[location.hash.slice(1)];
  if (legacy) history.replaceState(null, "", PAGES[legacy].path);

  // Same-site links to a page switch views without reloading.
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || a.target || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !pageForPath(url.pathname)) return;
    e.preventDefault();
    if (url.pathname !== location.pathname) history.pushState(null, "", url.pathname);
    show();
    scrollTo(0, 0);
  });
  addEventListener("popstate", show);
  show();
}
