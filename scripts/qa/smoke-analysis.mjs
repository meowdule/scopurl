#!/usr/bin/env node
/**
 * CI smoke: run a short analysis on example.com and validate artifacts.
 */
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyReport } from "./verify-report.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const REPORT_ID = process.env.QA_REPORT_ID || "qa-smoke";

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
      else reject(new Error(`exit ${code}: node ${args.join(" ")}`));
    });
  });
}

async function main() {
  console.log(`[qa:smoke] Running analysis ${REPORT_ID}…`);
  await runNode(
    [
      "scripts/run-analysis.mjs",
      `--report-id=${REPORT_ID}`,
      "--target-url=https://example.com",
      "--device=mobile",
      "--max-pages=3",
      "--max-depth=1",
      "--trace-mode=failure",
    ],
    { SITE_SCOPE_FAST: "1" },
  );

  const reportPath = path.join(ROOT, "public", "reports", REPORT_ID, "report.json");
  const report = JSON.parse(await fs.readFile(reportPath, "utf8"));
  const errors = await verifyReport(report, { reportId: REPORT_ID });
  if (errors.length) {
    throw new Error(`Report validation failed: ${errors.join(", ")}`);
  }

  const cardPath = path.join(ROOT, "public", "cards", `${report.cardId}.json`);
  const card = JSON.parse(await fs.readFile(cardPath, "utf8"));
  if (card.targetUrl || card.reportId) {
    throw new Error("card.json must not contain targetUrl or reportId");
  }
  if (!card.overallScore && card.overallScore !== 0) {
    throw new Error("card.json missing overallScore");
  }

  const statusPath = path.join(ROOT, "public", "reports", REPORT_ID, "status.json");
  const status = JSON.parse(await fs.readFile(statusPath, "utf8"));
  if (status.phase !== "complete") {
    throw new Error(`status phase expected complete, got ${status.phase}`);
  }

  console.log(
    `[qa:smoke] OK — pages=${report.pages.length} score=${report.summary.healthScore} card=${report.cardId}`,
  );
}

main().catch((e) => {
  console.error("[qa:smoke] FAILED:", e.message || e);
  process.exitCode = 1;
});
