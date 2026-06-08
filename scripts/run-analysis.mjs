#!/usr/bin/env node
import process from "node:process";
import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import { reportsDir, writeJson, readJson } from "./analysis/fs-utils.mjs";
import { writeStatus } from "./analysis/status.mjs";
import { nodeQuickProbe } from "./analysis/node-quick-probe.mjs";
import { discoverUrls } from "./analysis/crawler.mjs";
import { isInCrawlScope, normalizeUrl } from "./analysis/url-utils.mjs";
import { explorePageInteractions } from "./analysis/interaction-crawl.mjs";
import { waitForSpaReady } from "./analysis/spa-wait.mjs";
import { analyzePage } from "./analysis/page-analyzer.mjs";
import { buildSummary } from "./analysis/report-summary.mjs";
import { renderReportHtml } from "./analysis/report-html.mjs";
import {
  ANALYSIS_CONFIG,
  retentionExpiresAt,
  setRuntimeCrawlLimits,
  setRuntimeDeviceProfile,
  setRuntimeTraceMode,
} from "./analysis/analysis-config.mjs";
import { playwrightContextOptions } from "./analysis/viewport-profile.mjs";
import { AnalysisTimer } from "./analysis/timing.mjs";
import { captureViewportScreenshot } from "./analysis/screenshot.mjs";
import { randomUUID } from "node:crypto";
import { detectErrorCode } from "./analysis/error-codes.mjs";
import { sanitizeReportForPublish } from "./analysis/sanitize-report.mjs";

function parseDeviceProfile(value) {
  return value === "mobile" ? "mobile" : "desktop";
}

function parseTraceMode(value) {
  if (value === "all" || value === "off" || value === "failure") return value;
  return "failure";
}

function parseOptionalInt(value) {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

async function readRequest({
  requestFile,
  reportId,
  targetUrl,
  device,
  maxPages,
  maxDepth,
  traceMode,
}) {
  if (requestFile) {
    const data = await readJson(path.resolve(requestFile));
    return {
      reportId: data.reportId,
      targetUrl: data.targetUrl,
      deviceProfile: parseDeviceProfile(data.deviceProfile),
      maxPages: parseOptionalInt(data.maxPages),
      maxDepth: parseOptionalInt(data.maxDepth),
      traceMode: parseTraceMode(data.traceMode),
    };
  }
  if (reportId && targetUrl) {
    return {
      reportId,
      targetUrl,
      deviceProfile: parseDeviceProfile(device),
      maxPages: parseOptionalInt(maxPages),
      maxDepth: parseOptionalInt(maxDepth),
      traceMode: parseTraceMode(traceMode),
    };
  }
  throw new Error(
    "Provide --request-file=... or both --report-id and --target-url",
  );
}

async function runQuickHome({ browser, targetUrl, reportId, absDir, deviceProfile }) {
  const nodeProbe = await nodeQuickProbe(targetUrl);
  const ctx = await browser.newContext(playwrightContextOptions(deviceProfile));
  try {
    const page = await ctx.newPage();
    let internalLinkCount = 0;
    let httpOk = nodeProbe.httpOk;
    let httpStatus = nodeProbe.httpStatus;
    let finalUrl = nodeProbe.finalUrl;
    let redirectChain = nodeProbe.redirectChain;
    try {
      const resp = await page.goto(targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });
      httpStatus = resp?.status() ?? httpStatus;
      httpOk = !!httpStatus && httpStatus < 400;
      finalUrl = page.url();
      await waitForSpaReady(page, { short: true, fast: true });
      const explored = await explorePageInteractions(page, finalUrl, targetUrl, {
        profile: "homepage",
        deviceProfile,
      });
      internalLinkCount = explored.links.length;
      const shotRel = `reports/${reportId}/screenshots/quick-home.jpg`;
      const shotAbs = path.join(absDir, "screenshots", "quick-home.jpg");
      await fs.mkdir(path.dirname(shotAbs), { recursive: true });
      await captureViewportScreenshot(page, shotAbs);
      return {
        validUrl: true,
        dnsOk: nodeProbe.dnsOk,
        dnsMessage: nodeProbe.dnsMessage,
        httpStatus,
        httpOk,
        finalUrl,
        redirectChain,
        sslOk: nodeProbe.sslOk,
        sslMessage: nodeProbe.sslMessage,
        responseTimeMs: nodeProbe.responseTimeMs,
        internalLinkCount,
        screenshotRelativePath: shotRel,
      };
    } catch (e) {
      return {
        validUrl: true,
        dnsOk: nodeProbe.dnsOk,
        dnsMessage: nodeProbe.dnsMessage,
        httpStatus,
        httpOk: false,
        finalUrl,
        redirectChain,
        sslOk: nodeProbe.sslOk,
        sslMessage: nodeProbe.sslMessage,
        responseTimeMs: nodeProbe.responseTimeMs,
        internalLinkCount,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  } finally {
    await ctx.close();
  }
}

async function analyzePagesParallel({
  browser,
  urls,
  reportId,
  absDir,
  targetUrl,
  timer,
  deviceProfile,
}) {
  const concurrency = ANALYSIS_CONFIG.parallel.pageConcurrency;
  const pages = [];
  const brokenLinks = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const chunk = urls.slice(i, i + concurrency);
    const results = await Promise.all(
      chunk.map((url, j) => {
        const index = i + j;
        return analyzePage({
          browser,
          reportId,
          url,
          reportsAbsDir: absDir,
          startUrl: targetUrl,
          isHomepage: index === 0,
          deviceProfile,
          runFullLighthouse:
            index === 0 && ANALYSIS_CONFIG.lighthouse.fullOnFirstPageOnly,
          analysisTimer: timer,
        });
      }),
    );

    for (const result of results) {
      const { brokenLinks: bl, ...pageRest } = result;
      pages.push(pageRest);
      brokenLinks.push(...(bl || []));
    }
  }

  return { pages, brokenLinks };
}

function phaseWaitLabel(phase) {
  const map = {
    queued: "?? ?? ?? ? 3-8?",
    quick: "?? ?? ? (? 1?)",
    crawling: "??? ?? ? (? 1-3?)",
    analyzing: "?? ?? ? (? 2-6?)",
  };
  return map[phase];
}

async function main() {
  const { values } = parseArgs({
    options: {
      "request-file": { type: "string" },
      "report-id": { type: "string" },
      "target-url": { type: "string" },
      device: { type: "string" },
      "max-pages": { type: "string" },
      "max-depth": { type: "string" },
      "trace-mode": { type: "string" },
    },
    allowPositionals: true,
  });

  const requestFile = process.env.REQUEST_FILE || values["request-file"];
  const reportIdArg = process.env.REPORT_ID || values["report-id"];
  const targetArg = process.env.TARGET_URL || values["target-url"];

  const deviceArg = process.env.SITE_SCOPE_DEVICE || values.device;
  const maxPagesArg = process.env.SITE_SCOPE_MAX_PAGES || values["max-pages"];
  const maxDepthArg = process.env.SITE_SCOPE_MAX_DEPTH || values["max-depth"];
  const traceModeArg = process.env.TRACE_MODE || values["trace-mode"];

  const { reportId, targetUrl, deviceProfile, maxPages, maxDepth, traceMode } = await readRequest({
    requestFile,
    reportId: reportIdArg,
    targetUrl: targetArg,
    device: deviceArg,
    maxPages: maxPagesArg,
    maxDepth: maxDepthArg,
    traceMode: traceModeArg,
  });

  setRuntimeDeviceProfile(deviceProfile);
  setRuntimeCrawlLimits({ maxPages, maxDepth });
  setRuntimeTraceMode(traceMode);

  const absDir = reportsDir(reportId);
  await fs.mkdir(absDir, { recursive: true });

  const timer = new AnalysisTimer();
  const createdAt = new Date().toISOString();

  await writeStatus(reportId, {
    targetUrl,
    phase: "queued",
    quick: undefined,
    error: undefined,
    estimatedWaitLabel: phaseWaitLabel("queued"),
  });

  timer.start("browser_launch");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  timer.end("browser_launch");

  try {
    timer.start("quick_scan");
    const quick = await runQuickHome({
      browser,
      targetUrl,
      reportId,
      absDir,
      deviceProfile,
    });
    timer.end("quick_scan");

    await writeStatus(reportId, {
      targetUrl,
      phase: "quick",
      quick,
      estimatedWaitLabel: phaseWaitLabel("quick"),
    });

    await writeStatus(reportId, {
      targetUrl,
      phase: "crawling",
      quick,
      estimatedWaitLabel: phaseWaitLabel("crawling"),
    });

    timer.start("crawl");
    let { urls, crawlMeta } = await discoverUrls({
      browser,
      startUrl: targetUrl,
      maxPages: ANALYSIS_CONFIG.crawl.maxPages,
      maxDepth: ANALYSIS_CONFIG.crawl.maxDepth,
      deviceProfile,
    });
    urls = urls.filter((u) => isInCrawlScope(u, targetUrl));
    if (urls.length === 0) {
      const seed = normalizeUrl(targetUrl, targetUrl);
      if (seed) urls = [seed];
    }
    timer.end("crawl");

    await writeStatus(reportId, {
      targetUrl,
      phase: "analyzing",
      quick,
      estimatedWaitLabel: phaseWaitLabel("analyzing"),
    });

    timer.start("page_analysis");
    const { pages, brokenLinks } = await analyzePagesParallel({
      browser,
      urls,
      reportId,
      absDir,
      targetUrl,
      timer,
      deviceProfile,
    });
    timer.end("page_analysis");

    const homePage = pages[0];
    if (homePage?.interactionFlow) {
      crawlMeta.interactionFlow = homePage.interactionFlow;
    }
    if (homePage?.interactionDiscovery) {
      crawlMeta.discoveryStats = {
        ...crawlMeta.discoveryStats,
        ...homePage.interactionDiscovery,
      };
    }
    for (const p of pages) {
      if (p.interactionLog?.length) {
        crawlMeta.interactions.push(...p.interactionLog);
        const meaningful = p.interactionLog.filter((e) => e.success !== false);
        crawlMeta.discoveryStats.clicksRecorded += meaningful.length;
      }
    }
    crawlMeta.mode = "homepage_rich_subpage_light";

    const dedupBroken = [];
    const seen = new Set();
    for (const b of brokenLinks) {
      const k = `${b.from}|${b.to}`;
      if (seen.has(k)) continue;
      seen.add(k);
      dedupBroken.push(b);
    }

    timer.start("report_generation");
    const summary = buildSummary(pages);
    const completedAt = new Date().toISOString();
    const expiresAt = retentionExpiresAt(completedAt);
    const cardId = randomUUID();
    const timing = timer.toReport();
    timer.logSummary();

    const report = {
      reportId,
      targetUrl,
      deviceProfile,
      createdAt,
      completedAt,
      expiresAt,
      cardId,
      quick,
      pages,
      brokenLinks: dedupBroken.slice(0, 200),
      summary,
      crawlMeta,
      timing,
      crawlLimits: {
        requested: {
          maxPages: maxPagesArg != null ? Number(maxPagesArg) : null,
          maxDepth: maxDepthArg != null ? Number(maxDepthArg) : null,
          traceMode: traceModeArg || null,
        },
        applied: {
          maxPages: ANALYSIS_CONFIG.crawl.maxPages,
          maxDepth: ANALYSIS_CONFIG.crawl.maxDepth,
          traceMode,
        },
      },
    };

    await writeJson(path.join(absDir, "report.json"), sanitizeReportForPublish(report));
    const html = renderReportHtml(report);
    await fs.writeFile(path.join(absDir, "index.html"), html, "utf8");

    const cardsDir = path.join(process.cwd(), "public", "cards");
    await fs.mkdir(cardsDir, { recursive: true });
    const cats = summary.categoryScores || {};
    const seo = cats.seo ?? 72;
    const cardIssueCount =
      pages.reduce(
        (s, p) =>
          s +
          (p.axeViolations || []).reduce((n, v) => n + v.nodes, 0) +
          (p.uiIssues?.filter((i) => i.severity !== "info").length ?? 0),
        0,
      ) + dedupBroken.length;
    await writeJson(path.join(cardsDir, `${cardId}.json`), {
      cardId,
      overallScore: summary.healthScore,
      categoryScores: summary.categoryScores,
      statusLabel: summary.statusLabel,
      generatedAt: completedAt,
      topImprovements: summary.topImprovements || [],
      pageCount: pages.length,
      issueCount: cardIssueCount,
      analysisSeconds: timing?.totalSeconds ?? null,
      axisScores: [
        { key: "performance", label: "??", score: cats.performance ?? 70 },
        { key: "accessibility", label: "???", score: cats.accessibility ?? 75 },
        { key: "ux", label: "???", score: cats.ux ?? 80 },
        { key: "seo", label: "SEO", score: seo },
        {
          key: "shareability",
          label: "???",
          score: Math.min(100, Math.round(seo + 2)),
        },
        { key: "security", label: "??", score: quick.sslOk ? 92 : 68 },
        { key: "stability", label: "???", score: dedupBroken.length ? 78 : 88 },
      ],
    });

    timer.end("report_generation");

    await writeStatus(reportId, {
      targetUrl,
      phase: "complete",
      quick,
      expiresAt,
      estimatedWaitLabel: undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    let quickOnFail;
    try {
      const statusFile = path.join(absDir, "status.json");
      const prev = await readJson(statusFile);
      quickOnFail = prev?.quick;
    } catch {
      quickOnFail = undefined;
    }
    await writeStatus(reportId, {
      targetUrl,
      phase: "failed",
      quick: quickOnFail,
      error: msg,
      errorCode: detectErrorCode(msg, quickOnFail),
    });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

await main();



