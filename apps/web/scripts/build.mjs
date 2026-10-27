// Assemble the static site in dist/: one HTML file per page (each with its own title,
// description, canonical URL, link-preview tags and the right view shown before scripts run),
// the scripts and styles, static files, sitemap.xml and robots.txt, plus the library build under lib/.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { PAGES, SITE_NAME, SITE_URL } from "../src/core/pages.js";

const here = (p) => new URL(`../${p}`, import.meta.url);
rmSync(here("dist"), { recursive: true, force: true });
mkdirSync(here("dist"));
for (const entry of ["src", "styles"]) cpSync(here(entry), here(`dist/${entry}`), { recursive: true });
if (existsSync(here("static"))) cpSync(here("static"), here("dist"), { recursive: true });
cpSync(new URL("../../../packages/thai-test-data/dist", import.meta.url), here("dist/lib"), { recursive: true });

const MARKER = /<!-- page-meta:[^>]*-->/;
const template = readFileSync(here("index.html"), "utf8");
if (!MARKER.test(template)) throw new Error("index.html is missing the page-meta marker");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const OG_IMAGE = `${SITE_URL}/og.png`;
const STRUCTURED = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: PAGES.generate.description,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  inLanguage: ["th", "en"],
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
  license: "https://opensource.org/licenses/MIT",
  codeRepository: "https://github.com/jodpacharapon/thai-test-data",
});

function metaFor(page) {
  const url = SITE_URL + page.path;
  return [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:locale" content="th_TH">`,
    `<meta property="og:title" content="${esc(page.title)}">`,
    `<meta property="og:description" content="${esc(page.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="Thai Test Data: generate เลขบัตรประชาชนพร้อม valid และ invalid case">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<script type="application/ld+json">${STRUCTURED}</script>`,
  ].join("\n");
}

// Show this page's view in the HTML itself, so it is right before scripts run (and for crawlers).
function showView(html, name) {
  return html
    .replace(/(<section class="view[^"]*" id="view-)(\w+)("[^>]*?)( hidden)?>/g, (m, a, id, rest) => `${a}${id}${rest}${id === name ? "" : " hidden"}>`)
    .replace(/<a href="([^"]+)" data-view="(\w+)"( aria-current="page")?>/g, (m, href, view) => `<a href="${href}" data-view="${view}"${view === name ? ' aria-current="page"' : ""}>`)
    .replace(MARKER, metaFor(PAGES[name]));
}

for (const [name, page] of Object.entries(PAGES)) {
  const file = page.path === "/" ? "index.html" : `${page.path.slice(1)}.html`;
  writeFileSync(here(`dist/${file}`), showView(template, name));
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(here("dist/sitemap.xml"), [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...Object.values(PAGES).map((p) => `  <url><loc>${SITE_URL}${p.path}</loc><lastmod>${today}</lastmod></url>`),
  "</urlset>",
  "",
].join("\n"));
writeFileSync(here("dist/robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log("Built apps/web/dist");
