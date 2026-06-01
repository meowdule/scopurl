#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

export async function verifyReport(report, { reportId } = {}) {
  const errors = [];
  if (!report?.summary?.healthScore && report?.summary?.healthScore !== 0) {
    errors.push("missing summary.healthScore");
  }
  if (!report?.quick?.validUrl) errors.push("missing quick.validUrl");
  if (!Array.isArray(report?.pages) || report.pages.length < 1) {
    errors.push("pages empty");
  }
  if (!report?.expiresAt) errors.push("missing expiresAt");
  if (!report?.cardId) errors.push("missing cardId");
  if (!report?.crawlLimits?.applied) errors.push("missing crawlLimits.applied");
  if (!report?.summary?.topImprovements) {
    errors.push("missing summary.topImprovements");
  }
  if (reportId && report.reportId !== reportId) {
    errors.push(`reportId mismatch ${report.reportId} !== ${reportId}`);
  }
  return errors;
}

async function main() {
  const reportPath = process.argv[2];
  if (!reportPath) {
    console.error("Usage: node scripts/qa/verify-report.mjs <path-to-report.json>");
    process.exitCode = 1;
    return;
  }
  const abs = path.isAbsolute(reportPath)
    ? reportPath
    : path.join(ROOT, reportPath);
  const report = JSON.parse(await fs.readFile(abs, "utf8"));
  const errors = await verifyReport(report);
  if (errors.length) {
    console.error("Invalid report:", errors.join(", "));
    process.exitCode = 1;
  } else {
    console.log("Report OK:", abs);
  }
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  await main();
}
