// Assemble the static site in dist/: the page files plus the library build under lib/.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";

const here = (p) => new URL(`../${p}`, import.meta.url);
rmSync(here("dist"), { recursive: true, force: true });
mkdirSync(here("dist"));
for (const file of ["index.html", "styles.css", "app.js"]) {
  if (existsSync(here(file))) cpSync(here(file), here(`dist/${file}`));
}
cpSync(new URL("../../../packages/thai-test-data/dist", import.meta.url), here("dist/lib"), { recursive: true });
console.log("Built apps/web/dist");
