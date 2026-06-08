#!/usr/bin/env node
/**
 * CI: run Lighthouse against the static `out/` home page.
 * Launches Playwright Chromium with a CDP port, then connects Lighthouse to it.
 * (Direct --chrome-path fails on Linux CI: "Unable to connect to Chrome".)
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { chromium } from "playwright";
import lighthouse from "lighthouse";

const PORT = Number(process.env.QA_LH_PORT || 3457);
const DEBUG_PORT = Number(process.env.QA_LH_DEBUG_PORT || 9222);
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

  let browser;
  try {
    await waitForServer(HOME_URL);

    browser = await chromium.launch({
      headless: true,
      args: [
        `--remote-debugging-port=${DEBUG_PORT}`,
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const result = await lighthouse(HOME_URL, {
      port: DEBUG_PORT,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices"],
    });

    await fs.writeFile(OUT_FILE, result.report);

    const categories = result.lhr.categories || {};
    const perf = Math.round((categories.performance?.score || 0) * 100);
    const a11y = Math.round((categories.accessibility?.score || 0) * 100);
    console.log("Performance", perf);
    console.log("Accessibility", a11y);
    if ((categories.performance?.score || 0) < 0.5) {
      throw new Error(`Performance score too low: ${perf}`);
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    serve.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("[qa:lighthouse]", err.message || err);
  process.exitCode = 1;
});
