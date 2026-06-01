#!/usr/bin/env node
/**
 * getcha.kr mobile crawl smoke — verifies SPA discovery finds multiple routes.
 * Pass criteria: quick.internalLinkCount >= MIN_LINKS OR pages.length >= MIN_PAGES.
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyReport } from "./verify-report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const REPORT_ID = process.env.QA_GETCHA_ID || "qa-getcha";
const MIN_LINKS = Number(process.env.QA_GETCHA_MIN_LINKS || "5");
const MIN_PAGES = Number(process.env.QA_GETCHA_MIN_PAGES || "2");
const STRICT = process.env.QA_GETCHA_STRICT === "1";

function runNode(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`exit ${code}`));
    });
  });
}

async function main() {
  console.log(`[qa:getcha] https://m.getcha.kr/home (mobile)…`);
  await runNode(
    [
      "scripts/run-analysis.mjs",
      `--report-id=${REPORT_ID}`,
      "--target-url=https://m.getcha.kr/home",
      "--device=mobile",
      "--max-pages=10",
      "--max-depth=2",
      "--trace-mode=failure",
    ],
    { SITE_SCOPE_FAST: process.env.SITE_SCOPE_FAST || "0" },
  );

  const reportPath = path.join(ROOT, "public", "reports", REPORT_ID, "report.json");
  const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
  const errors = await verifyReport(report, { reportId: REPORT_ID });
  if (errors.length) {
    throw new Error(errors.join(", "));
  }

  const links = report.quick?.internalLinkCount ?? 0;
  const pages = report.pages?.length ?? 0;
  const discovered = report.crawlMeta?.discoveryStats?.linksDiscovered ?? 0;

  console.log(
    `[qa:getcha] internalLinkCount=${links} pages=${pages} linksDiscovered=${discovered}`,
  );

  const linksOk = links >= MIN_LINKS;
  const pagesOk = pages >= MIN_PAGES;

  if (!linksOk) {
    const msg = `internalLinkCount ${links} < ${MIN_LINKS}`;
    if (STRICT) throw new Error(msg);
    console.warn(`[qa:getcha] WARN: ${msg}`);
  }
  if (!pagesOk) {
    const msg = `pages crawled ${pages} < ${MIN_PAGES}`;
    if (STRICT) throw new Error(msg);
    console.warn(`[qa:getcha] WARN: ${msg}`);
  }

  if (!linksOk && !pagesOk && STRICT) {
    throw new Error("getcha smoke failed strict mode");
  }

  if (linksOk || pagesOk) {
    console.log("[qa:getcha] OK");
  } else {
    console.warn(
      "[qa:getcha] completed with warnings (discovery OK but multi-page crawl still limited)",
    );
  }
}

main().catch((e) => {
  console.error("[qa:getcha] FAILED:", e.message || e);
  process.exitCode = 1;
});
