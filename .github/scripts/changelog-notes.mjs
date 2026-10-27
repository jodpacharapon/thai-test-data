// Print the CHANGELOG section for a version, for use as GitHub release notes.
//   node .github/scripts/changelog-notes.mjs 0.2.0
import { readFileSync } from "node:fs";

const version = process.argv[2];
if (!version) {
  console.error("Usage: node .github/scripts/changelog-notes.mjs <version>");
  process.exit(1);
}

const changelog = readFileSync(new URL("../../CHANGELOG.md", import.meta.url), "utf8");
const heading = new RegExp(`^## \\[${version.replace(/\./g, "\\.")}\\][^\\n]*\\n`, "m");
const match = heading.exec(changelog);
if (!match) {
  console.error(`CHANGELOG.md has no "## [${version}]" section`);
  process.exit(1);
}

const rest = changelog.slice(match.index + match[0].length);
const end = rest.search(/^## \[|^\[[^\]]+\]: /m);
const body = (end === -1 ? rest : rest.slice(0, end)).trim();
const compare = changelog.match(new RegExp(`^\\[${version.replace(/\./g, "\\.")}\\]: (\\S+)`, "m"))?.[1];

console.log(`${body}

**Web app:** https://thai-test-data.vercel.app${compare ? `\n\n**Full changelog:** ${compare}` : ""}`);
