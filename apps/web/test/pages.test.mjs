import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PAGES, pageForPath } from "../src/core/pages.js";

test("vercel.json rewrites every page path to its HTML file", () => {
  const { rewrites } = JSON.parse(readFileSync(new URL("../../../vercel.json", import.meta.url), "utf8"));
  const expected = Object.values(PAGES).filter((p) => p.path !== "/").map((p) => ({ source: p.path, destination: `${p.path}.html` }));
  assert.deepEqual(rewrites, expected);
});

test("pageForPath accepts the clean path, a trailing slash and the .html file", () => {
  assert.equal(pageForPath("/"), "generate");
  assert.equal(pageForPath("/index.html"), "generate");
  assert.equal(pageForPath("/docs"), "docs");
  assert.equal(pageForPath("/docs/"), "docs");
  assert.equal(pageForPath("/validator.html"), "validate");
  assert.equal(pageForPath("/nope"), undefined);
});

test("the build writes each page with its own title and canonical URL, plus the sitemap", () => {
  const dist = (f) => readFileSync(new URL(`../dist/${f}`, import.meta.url), "utf8");
  for (const page of Object.values(PAGES)) {
    const html = dist(page.path === "/" ? "index.html" : `${page.path.slice(1)}.html`);
    assert.ok(html.includes(`<link rel="canonical" href="https://thai-test-data.vercel.app${page.path}">`));
    assert.ok(html.includes("<title>"));
    assert.ok(html.includes('<meta name="google-site-verification" content="BduaTRqeVVY_KIrguWzr5KXrvoh4l0HdAnSZ4JnhrIs">'));
    assert.ok(dist("sitemap.xml").includes(`<loc>https://thai-test-data.vercel.app${page.path}</loc>`));
  }
  assert.equal(dist("googlec976bffbd73b538c.html"), "google-site-verification: googlec976bffbd73b538c.html");
});
