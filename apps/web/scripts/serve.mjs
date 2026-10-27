// Minimal static server for the built web app (dist/): node scripts/serve.mjs [port]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const port = Number(process.argv[2] ?? 8080);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml",
  ".xml": "application/xml", ".txt": "text/plain; charset=utf-8" };

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const file = join(root, path === "" || path.endsWith("/") ? join(path, "index.html") : path);
  if (!file.startsWith(root)) return res.writeHead(403).end();
  // Like Vercel's cleanUrls: /docs serves docs.html.
  for (const candidate of extname(file) ? [file] : [file, `${file}.html`]) {
    try {
      const body = await readFile(candidate);
      return res.writeHead(200, { "content-type": types[extname(candidate)] ?? "application/octet-stream" }).end(body);
    } catch {}
  }
  res.writeHead(404).end("Not found");
}).listen(port, () => console.log(`Web app: http://localhost:${port}`));
