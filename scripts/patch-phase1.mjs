import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const parent = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function patchReportSummary() {
  const file = path.join(parent, "scripts/analysis/report-summary.mjs");
  let s = fs.readFileSync(file, "utf8");
  if (s.includes("export function buildTopImprovements")) {
    console.log("report-summary: already patched");
    return;
  }
  const insert = `
const IMPROVEMENT_MAX_LEN = 48;

function shortenLine(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  if (t.length <= IMPROVEMENT_MAX_LEN) return t;
  return t.slice(0, IMPROVEMENT_MAX_LEN - 1) + "\u2026";
}

export function buildTopImprovements(summary) {
  const seen = new Set();
  const out = [];
  const push = (raw) => {
    const line = shortenLine(raw);
    if (!line || seen.has(line)) return;
    seen.add(line);
    out.push(line);
  };
  const hb = summary.healthBreakdown;
  if (hb?.explanation?.length) {
    for (const line of hb.explanation) {
      if (line.startsWith("\uC885\uD569 \uC810\uC218 =")) continue;
      push(line);
      if (out.length >= 3) return out;
    }
  }
  for (const p of hb?.penalties || []) {
    push(p.message);
    if (out.length >= 3) return out;
  }
  for (const w of summary.mobileWarnings || []) {
    push(w);
    if (out.length >= 3) return out;
  }
  const cats = summary.categoryScores;
  if (cats) {
    const entries = [
      { label: "\uC131\uB2A5", value: cats.performance },
      { label: "\uC811\uADFC\uC131", value: cats.accessibility },
      { label: "\uC0AC\uC6A9\uC131", value: cats.ux },
      { label: "\uAC80\uC0C9\u00B7\uACF5\uC720", value: cats.seo },
    ].filter((e) => typeof e.value === "number");
    entries.sort((a, b) => a.value - b.value);
    const weakest = entries[0];
    if (weakest && weakest.value < 70) {
      push(weakest.label + " \uC601\uC5ED \uAC1C\uC120\uC774 \uD544\uC694\uD569\uB2C8\uB2E4 (" + weakest.value + "\uC810).");
    }
  }
  if (out.length === 0 && summary.healthScore != null) {
    push(
      summary.healthScore >= 75
        ? "\uC804\uBC18\uC801\uC73C\uB85C \uC591\uD638\uD569\uB2C8\uB2E4. \uC138\uBD80 \uD56D\uBAA9\uC744 \uC810\uAC80\uD574 \uBCF4\uC138\uC694."
        : "\uC885\uD569 \uC810\uC218\uB97C \uB192\uC774\uB824\uBA74 \uC131\uB2A5\u00B7\uC811\uADFC\uC131\u00B7\uC0AC\uC6A9\uC131\uC744 \uD568\uAED8 \uAC1C\uC120\uD558\uC138\uC694.",
    );
  }
  return out.slice(0, 3);
}

`;
  s = s.replace("export function buildSummary(pages) {", insert + "export function buildSummary(pages) {");
  s = s.replace(/  return \{\r?\n    healthScore,/, "  const summary = {\n    healthScore,");
  s = s.replace(
    /      explanation: healthExplanation,\r?\n    },\r?\n  };\r?\n}/,
    "      explanation: healthExplanation,\n    },\n  };\n\n  summary.topImprovements = buildTopImprovements(summary);\n  return summary;\n}",
  );
  fs.writeFileSync(file, s);
  console.log("report-summary.mjs patched");
}

function patchRunAnalysis() {
  const file = path.join(parent, "scripts/run-analysis.mjs");
  let s = fs.readFileSync(file, "utf8");
  if (!s.includes("setRuntimeCrawlLimits")) {
    s = s.replace(
      "  setRuntimeDeviceProfile,\n} from \"./analysis/analysis-config.mjs\";",
      "  retentionExpiresAt,\n  setRuntimeCrawlLimits,\n  setRuntimeDeviceProfile,\n} from \"./analysis/analysis-config.mjs\";",
    );
    s = s.replace(
      'import { captureViewportScreenshot } from "./analysis/screenshot.mjs";',
      'import { captureViewportScreenshot } from "./analysis/screenshot.mjs";\nimport { randomUUID } from "node:crypto";',
    );
  }
  if (!s.includes('"max-pages"')) {
    s = s.replace(
      '"target-url": { type: "string" },\n    },',
      '"target-url": { type: "string" },\n      device: { type: "string" },\n      "max-pages": { type: "string" },\n      "max-depth": { type: "string" },\n    },',
    );
  }
  if (!s.includes("parseDeviceProfile")) {
    s = s.replace(
      "async function readRequest({ requestFile, reportId, targetUrl }) {",
      "function parseDeviceProfile(value) {\n  return value === \"mobile\" ? \"mobile\" : \"desktop\";\n}\n\nfunction parseOptionalInt(value) {\n  if (value == null || value === \"\") return undefined;\n  const n = Number(value);\n  return Number.isNaN(n) ? undefined : n;\n}\n\nasync function readRequest({\n  requestFile,\n  reportId,\n  targetUrl,\n  device,\n  maxPages,\n  maxDepth,\n}) {",
    );
    s = s.replace(
      "    return {\n      reportId: data.reportId,\n      targetUrl: data.targetUrl,\n      deviceProfile,\n    };",
      "    return {\n      reportId: data.reportId,\n      targetUrl: data.targetUrl,\n      deviceProfile: parseDeviceProfile(data.deviceProfile),\n      maxPages: parseOptionalInt(data.maxPages),\n      maxDepth: parseOptionalInt(data.maxDepth),\n    };",
    );
    s = s.replace(
      '    const deviceProfile =\n      data.deviceProfile === "mobile" ? "mobile" : "desktop";',
      "",
    );
    s = s.replace(
      "    return { reportId, targetUrl, deviceProfile: \"desktop\" };",
      "    return {\n      reportId,\n      targetUrl,\n      deviceProfile: parseDeviceProfile(device),\n      maxPages: parseOptionalInt(maxPages),\n      maxDepth: parseOptionalInt(maxDepth),\n    };",
    );
  }
  if (!s.includes("setRuntimeCrawlLimits({")) {
    s = s.replace(
      "  const { reportId, targetUrl, deviceProfile } = await readRequest({\n    requestFile,\n    reportId: reportIdArg,\n    targetUrl: targetArg,\n  });\n\n  setRuntimeDeviceProfile(deviceProfile);",
      "  const deviceArg = process.env.SITE_SCOPE_DEVICE || values.device;\n  const maxPagesArg =\n    process.env.SITE_SCOPE_MAX_PAGES || values[\"max-pages\"];\n  const maxDepthArg =\n    process.env.SITE_SCOPE_MAX_DEPTH || values[\"max-depth\"];\n\n  const { reportId, targetUrl, deviceProfile, maxPages, maxDepth } =\n    await readRequest({\n      requestFile,\n      reportId: reportIdArg,\n      targetUrl: targetArg,\n      device: deviceArg,\n      maxPages: maxPagesArg,\n      maxDepth: maxDepthArg,\n    });\n\n  setRuntimeDeviceProfile(deviceProfile);\n  setRuntimeCrawlLimits({ maxPages, maxDepth });",
    );
  }
  if (!s.includes("const createdAt = new Date")) {
    s = s.replace(
      "  const timer = new AnalysisTimer();\n\n  await writeStatus(reportId, {",
      "  const timer = new AnalysisTimer();\n  const createdAt = new Date().toISOString();\n\n  await writeStatus(reportId, {",
    );
  }
  if (!s.includes("expiresAt")) {
    s = s.replace(
      "    const completedAt = new Date().toISOString();\n    const timing = timer.toReport();",
      "    const completedAt = new Date().toISOString();\n    const expiresAt = retentionExpiresAt(completedAt);\n    const cardId = randomUUID();\n    const timing = timer.toReport();",
    );
    s = s.replace(
      "      createdAt: completedAt,\n      completedAt,",
      "      createdAt,\n      completedAt,\n      expiresAt,\n      cardId,",
    );
    s = s.replace(
      "      timing,\n    };",
      "      timing,\n      crawlLimits: {\n        maxPages: ANALYSIS_CONFIG.crawl.maxPages,\n        maxDepth: ANALYSIS_CONFIG.crawl.maxDepth,\n      },\n    };",
    );
    s = s.replace(
      "      phase: \"complete\",\n      quick,\n    });",
      "      phase: \"complete\",\n      quick,\n      expiresAt,\n    });",
    );
  }
  fs.writeFileSync(file, s);
  console.log("run-analysis.mjs patched");
}

patchReportSummary();
patchRunAnalysis();
