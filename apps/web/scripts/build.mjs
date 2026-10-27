// Assemble the static site in dist/: the page files plus the library build under lib/.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";

const here = (p) => new URL(`../${p}`, import.meta.url);
rmSync(here("dist"), { recursive: true, force: true });
mkdirSync(here("dist"));
for (const entry of ["index.html", "src", "styles"]) {
  if (existsSync(here(entry))) cpSync(here(entry), here(`dist/${entry}`), { recursive: true });
}
cpSync(new URL("../../../packages/thai-test-data/dist", import.meta.url), here("dist/lib"), { recursive: true });
console.log("Built apps/web/dist");
