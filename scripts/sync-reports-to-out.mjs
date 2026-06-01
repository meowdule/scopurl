import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const ent of entries) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) await copyDir(s, d);
    else await fs.copyFile(s, d);
  }
}

async function main() {
  const pairs = [
    ["public/reports", "out/reports"],
    ["public/cards", "out/cards"],
  ];
  for (const [relSrc, relDest] of pairs) {
    const src = path.join(ROOT, relSrc);
    const dest = path.join(ROOT, relDest);
    try {
      await fs.access(src);
    } catch {
      continue;
    }
    await copyDir(src, dest);
  }
}

await main();
