#!/usr/bin/env node
/**
 * CI: run Lighthouse against the static `out/` home page.
 * Uses Playwright's Chromium (same as analysis pipeline).
 */
import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import { chromium } from "playwright";

const execFileP = promisify(execFile);
const require = createRequire(import.meta.url);

const PORT = Number(process.env.QA_LH_PORT || 3457);
const HOME_URL = `http://127.0.0.1:${PORT}/`;
const OUT_FILE = "lighthouse-home.json";

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server not ready: ${url}`);
}

async function main() {
  const serve = spawn("npx", ["serve", "out", "-l", String(PORT)], {
    stdio: "inherit",
    shell: true,
  });

  try {
    await waitForServer(HOME_URL);

    const chromePath = chromium.executablePath();
    const lhCli = require.resolve("lighthouse/cli/index.js");
    await execFileP(
      process.execPath,
      [
        lhCli,
        HOME_URL,
        "--quiet",
        `--chrome-path=${chromePath}`,
        "--output=json",
        `--output-path=${OUT_FILE}`,
        "--only-categories=performance,accessibility,best-practices",
        "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu",
      ],
      { timeout: 120_000, env: { ...process.env, NODE_OPTIONS: "" } },
    );

    const report = JSON.parse(await fs.readFile(OUT_FILE, "utf8"));
    const categories = report.categories || {};
    const perf = Math.round((categories.performance?.score || 0) * 100);
    const a11y = Math.round((categories.accessibility?.score || 0) * 100);
    console.log("Performance", perf);
    console.log("Accessibility", a11y);
    if ((categories.performance?.score || 0) < 0.5) {
      throw new Error(`Performance score too low: ${perf}`);
    }
  } finally {
    serve.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("[qa:lighthouse]", err.message || err);
  process.exitCode = 1;
});
