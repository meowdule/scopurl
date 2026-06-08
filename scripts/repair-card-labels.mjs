#!/usr/bin/env node
/** Repair axisScores labels in public/cards/*.json (?? placeholder → Korean). */
import fs from "node:fs/promises";
import path from "node:path";
import { QUALITY_AXIS_LABELS } from "./analysis/axis-labels.mjs";

const CARDS_DIR = path.join(process.cwd(), "public", "cards");

function isBroken(label) {
  if (!label || label === "SEO") return false;
  return /^[\?·\s]+$/.test(label);
}

async function main() {
  const entries = await fs.readdir(CARDS_DIR);
  let fixed = 0;
  for (const name of entries) {
    if (!name.endsWith(".json")) continue;
    const filePath = path.join(CARDS_DIR, name);
    const card = JSON.parse(await fs.readFile(filePath, "utf8"));
    if (!Array.isArray(card.axisScores)) continue;

    let changed = false;
    card.axisScores = card.axisScores.map((a) => {
      const canonical = QUALITY_AXIS_LABELS[a.key];
      if (!canonical) return a;
      if (a.label === canonical) return a;
      if (isBroken(a.label) || a.label !== canonical) {
        changed = true;
        return { ...a, label: canonical };
      }
      return a;
    });

    if (changed) {
      await fs.writeFile(filePath, `${JSON.stringify(card, null, 2)}\n`, "utf8");
      console.log(`fixed ${name}`);
      fixed++;
    }
  }
  console.log(`Done. ${fixed} card(s) updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
