import fs from "node:fs";

function read(p) { return fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n"); }
function write(p, s) { fs.writeFileSync(p, s); console.log("updated", p); }

// AnalyzeForm imports and options builder usage
{
  const p = "components/AnalyzeForm.tsx";
  let s = read(p);
  s = s.replace(
`import {
  hasDispatchToken,
  startAnalysis,
  type DeviceProfile,
} from "@/lib/startAnalysis";
import { fetchReport, fetchStatus } from "@/lib/pollReport";
import type { ReportJson } from "@/lib/types";
import { assetUrl } from "@/lib/paths";`,
`import {
  hasDispatchToken,
  startAnalysis,
  type DeviceProfile,
  type TraceMode,
} from "@/lib/startAnalysis";
import {
  buildAnalysisOptions,
  DEFAULT_MAX_DEPTH,
  DEFAULT_MAX_PAGES,
  DEFAULT_TRACE_MODE,
  FREE_MAX_PAGES,
} from "@/lib/analysisOptions";
import { fetchReport, fetchStatus } from "@/lib/pollReport";
import type { ReportJson } from "@/lib/types";
import { assetUrl } from "@/lib/paths";`);

  s = s.replace(
`      await startAnalysis(id, v.normalized, {
        deviceProfile,
        maxPages: clampMaxPages(maxPages),
        maxDepth: clampMaxDepth(maxDepth),
        traceMode,
      });`,
`      await startAnalysis(
        id,
        v.normalized,
        buildAnalysisOptions({
          deviceProfile,
          maxPages,
          maxDepth,
          traceMode,
        }),
      );`);

  s = s.replace(/setMaxPages\(clampMaxPages\(e\.target\.value\)\)/g, "setMaxPages(Number(e.target.value))");
  s = s.replace(/setMaxDepth\(clampMaxDepth\(e\.target\.value\)\)/g, "setMaxDepth(Number(e.target.value))");

  write(p, s);
}

// run-analysis fixes: traceModeArg + requested/applied crawl limits
{
  const p = "scripts/run-analysis.mjs";
  let s = read(p);
  if (!s.includes("const traceModeArg")) {
    s = s.replace(
`  const maxDepthArg = process.env.SITE_SCOPE_MAX_DEPTH || values["max-depth"];

  const { reportId, targetUrl, deviceProfile, maxPages, maxDepth, traceMode } = await readRequest({`,
`  const maxDepthArg = process.env.SITE_SCOPE_MAX_DEPTH || values["max-depth"];
  const traceModeArg = process.env.TRACE_MODE || values["trace-mode"];

  const { reportId, targetUrl, deviceProfile, maxPages, maxDepth, traceMode } = await readRequest({`);
  }

  s = s.replace(
`      crawlLimits: {
        maxPages: ANALYSIS_CONFIG.crawl.maxPages,
        maxDepth: ANALYSIS_CONFIG.crawl.maxDepth,
        traceMode: traceMode,
      },`,
`      crawlLimits: {
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
      },`);

  write(p, s);
}

// page-analyzer: readable trace filename + httpErrors condition
{
  const p = "scripts/analysis/page-analyzer.mjs";
  let s = read(p);
  if (!s.includes("const httpErrors")) {
    s = s.replace("  const failedRequests = [];", "  const failedRequests = [];\n  const httpErrors = [];");
  }

  s = s.replace(
`  const traceDir = path.join(reportsAbsDir, "traces");
  const urlSafe = crypto.createHash("sha1").update(url).digest("hex").slice(0, 12);
  const traceZip = path.join(traceDir, `${urlSafe}.zip`);`,
`  const traceDir = path.join(reportsAbsDir, "traces");
  const shortHash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 6);
  const slug = (() => {
    try {
      const u = new URL(url);
      const seg = u.pathname.split("/").filter(Boolean).slice(-1)[0] || "home";
      return seg.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
    } catch {
      return "page";
    }
  })();
  const traceZip = path.join(traceDir, `${slug}_${shortHash}.zip`);`);

  s = s.replace(
`  page.on("response", (res) => {
    const st = res.status();
    if (st >= 400) failedRequests.push({ url: res.url(), status: st });
  });`,
`  page.on("response", (res) => {
    const st = res.status();
    if (st >= 400) {
      const entry = { url: res.url(), status: st };
      failedRequests.push(entry);
      httpErrors.push(entry);
    }
  });`);

  s = s.replace(
`            jsExceptions.length > 0 ||
            failedRequests.length > 0));`,
`            jsExceptions.length > 0 ||
            failedRequests.length > 0 ||
            httpErrors.length > 0));`);

  write(p, s);
}

// queue-request schemaVersion
{
  const p = ".github/workflows/queue-request.yml";
  let s = read(p);
  if (!s.includes('"schemaVersion": 3')) {
    s = s.replace(
`            "  \"traceMode\": \"${TRACE_MODE}\"," \\
            "  \"createdAt\": \"${NOW}\"" \\
            "}" > "requests/${REPORT_ID}.json"`,
`            "  \"traceMode\": \"${TRACE_MODE}\"," \\
            "  \"schemaVersion\": 3," \\
            "  \"createdAt\": \"${NOW}\"" \\
            "}" > "requests/${REPORT_ID}.json"`);
    write(p, s);
  }
}