#!/usr/bin/env node
/**
 * Delete expired report directories and orphan/expired score cards.
 * Retention: DATA_RETENTION_DAYS (default 30) from analysis-config.mjs.
 *
 * Usage:
 *   node scripts/cleanup-retention.mjs
 *   node scripts/cleanup-retention.mjs --dry-run
 */
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import {
  DATA_RETENTION_DAYS,
  retentionExpiresAt,
} from "./analysis/analysis-config.mjs";
import { readJson } from "./analysis/fs-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REPORTS_DIR = path.join(ROOT, "public", "reports");
const CARDS_DIR = path.join(ROOT, "public", "cards");
const PLACEHOLDER_CARD = "placeholder";

function isExpired(expiresAtIso, now = Date.now()) {
  if (!expiresAtIso) return false;
  const t = Date.parse(expiresAtIso);
  return !Number.isNaN(t) && t <= now;
}

function resolveReportExpiry(report) {
  if (report?.expiresAt) return report.expiresAt;
  const base = report?.completedAt || report?.createdAt;
  if (base) return retentionExpiresAt(base);
  return null;
}

async function listReportDirs() {
  try {
    const entries = await fs.readdir(REPORTS_DIR, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "ENOENT") {
      return [];
    }
    throw e;
  }
}

async function cleanupReports({ dryRun, now, log }) {
  const validCardIds = new Set();
  let removed = 0;

  for (const reportId of await listReportDirs()) {
    const reportPath = path.join(REPORTS_DIR, reportId, "report.json");
    let report;
    try {
      report = await readJson(reportPath);
    } catch {
      const stat = await fs.stat(path.join(REPORTS_DIR, reportId));
      const expiresAt = retentionExpiresAt(stat.mtime.toISOString());
      if (isExpired(expiresAt, now)) {
        log(`report ${reportId} (no report.json, dir mtime) → delete`);
        if (!dryRun) await fs.rm(path.join(REPORTS_DIR, reportId), { recursive: true, force: true });
        removed++;
      }
      continue;
    }

    const expiresAt = resolveReportExpiry(report);
    if (isExpired(expiresAt, now)) {
      log(`report ${reportId} expired ${expiresAt} → delete`);
      if (!dryRun) await fs.rm(path.join(REPORTS_DIR, reportId), { recursive: true, force: true });
      removed++;
    } else if (report.cardId) {
      validCardIds.add(report.cardId);
    }
  }

  return { removed, validCardIds };
}

async function cleanupCards({ dryRun, now, validCardIds, log }) {
  let removed = 0;
  let entries;
  try {
    entries = await fs.readdir(CARDS_DIR, { withFileTypes: true });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "ENOENT") return 0;
    throw e;
  }

  for (const ent of entries) {
    if (!ent.isFile() || !ent.name.endsWith(".json")) continue;
    const cardId = ent.name.replace(/\.json$/, "");
    if (cardId === PLACEHOLDER_CARD) continue;

    const cardPath = path.join(CARDS_DIR, ent.name);
    let card;
    try {
      card = await readJson(cardPath);
    } catch {
      log(`card ${cardId} (invalid json) → delete`);
      if (!dryRun) await fs.unlink(cardPath);
      removed++;
      continue;
    }

    if (validCardIds.has(cardId)) continue;

    log(`card ${cardId} (orphan, no active report) → delete`);
    if (!dryRun) await fs.unlink(cardPath);
    removed++;
  }

  return removed;
}

async function main() {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
    },
  });

  const dryRun = values["dry-run"] === true;
  const now = Date.now();
  const log = (msg) => console.log(dryRun ? `[dry-run] ${msg}` : msg);

  console.log(
    `SnapIt SiteScope retention cleanup (${DATA_RETENTION_DAYS} days)${dryRun ? " [DRY RUN]" : ""}`,
  );

  const { removed: reportsRemoved, validCardIds } = await cleanupReports({
    dryRun,
    now,
    log,
  });
  const cardsRemoved = await cleanupCards({ dryRun, now, validCardIds, log });

  console.log(
    `Done. Reports removed: ${reportsRemoved}, cards removed: ${cardsRemoved}`,
  );
}

await main();
