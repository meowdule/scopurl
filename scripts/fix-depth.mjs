import fs from "node:fs";
const f = "scripts/analysis/analysis-config.mjs";
let s = fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const old = `function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}`;
const neu = `function clampInt(value, min, max, fallback) {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}`;
if (s.includes(old)) {
  s = s.replace(old, neu);
  fs.writeFileSync(f, s);
  console.log("clampInt fixed");
} else {
  console.log("pattern not found, may already be fixed");
}