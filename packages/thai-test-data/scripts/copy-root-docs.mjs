// npm publishes from this folder, so copy the repo-level docs in before packing.
import { copyFileSync } from "node:fs";

for (const file of ["README.md", "LICENSE", "THIRD_PARTY_NOTICES.md"]) {
  copyFileSync(new URL(`../../../${file}`, import.meta.url), new URL(`../${file}`, import.meta.url));
}
