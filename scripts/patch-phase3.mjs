import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function write(rel, content) {
  fs.writeFileSync(path.join(root, rel), content.replace(/\r\n/g, "\n"));
  console.log("wrote", rel);
}

write(
  "lib/analysisOptions.ts",
  `export type TraceMode = "failure" | "all" | "off";

export type AnalysisStartOptions = {
  deviceProfile?: "mobile" | "desktop";
  maxPages?: number;
  maxDepth?: number;
  traceMode?: TraceMode;
};

export const FREE_MAX_PAGES = 20;
export const DEFAULT_MAX_PAGES = 20;
export const DEFAULT_MAX_DEPTH = 2;
export const DEFAULT_TRACE_MODE: TraceMode = "failure";

export function clampMaxPages(value: number | string | undefined): number {
  const n = Number(value);
  if (Number.isNaN(n)) return DEFAULT_MAX_PAGES;
  return Math.min(FREE_MAX_PAGES, Math.max(1, Math.round(n)));
}

export function clampMaxDepth(value: number | string | undefined): number {
  const n = Number(value);
  if (Number.isNaN(n)) return DEFAULT_MAX_DEPTH;
  return Math.min(10, Math.max(0, Math.round(n)));
}

export function parseTraceMode(value: unknown): TraceMode {
  if (value === "all" || value === "off" || value === "failure") return value;
  return DEFAULT_TRACE_MODE;
}
`,
);

// --- startAnalysis.ts ---
write(
  "lib/startAnalysis.ts",
  `import { getConfiguredRepo } from "@/lib/config";
import type { AnalysisStartOptions, TraceMode } from "@/lib/analysisOptions";
import {
  clampMaxDepth,
  clampMaxPages,
  parseTraceMode,
} from "@/lib/analysisOptions";

export type StartMode = "dispatch" | "issue";
export type DeviceProfile = "mobile" | "desktop";

export type { AnalysisStartOptions, TraceMode };

function buildPayload(
  reportId: string,
  targetUrl: string,
  options: AnalysisStartOptions = {},
) {
  const deviceProfile =
    options.deviceProfile === "mobile" ? "mobile" : "desktop";
  return {
    reportId,
    targetUrl,
    deviceProfile,
    maxPages: clampMaxPages(options.maxPages),
    maxDepth: clampMaxDepth(options.maxDepth),
    traceMode: parseTraceMode(options.traceMode),
    createdAt: new Date().toISOString(),
  };
}

async function dispatchAnalysis(
  reportId: string,
  targetUrl: string,
  options: AnalysisStartOptions,
  token: string,
): Promise<void> {
  const repo = getConfiguredRepo();
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new Error("Invalid repository configuration.");
  }

  const res = await fetch(
    \`https://api.github.com/repos/\${owner}/\${name}/dispatches\`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: \`Bearer \${token}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "sitescope-analyze",
        client_payload: buildPayload(reportId, targetUrl, options),
      }),
    },
  );

  if (res.status !== 204 && !res.ok) {
    const text = await res.text();
    throw new Error(
      \`Could not start analysis (\${res.status}). \${text.slice(0, 200)}\`,
    );
  }
}

export function openAnalysisIssue(
  reportId: string,
  targetUrl: string,
  options: AnalysisStartOptions = {},
): void {
  const repo = getConfiguredRepo();
  const [owner, name] = repo.split("/");
  if (!owner || !name) {
    throw new Error("Invalid repository configuration.");
  }

  const payload = JSON.stringify(
    buildPayload(reportId, targetUrl, options),
    null,
    2,
  );

  const params = new URLSearchParams({
    title: \`[SiteScope] \${reportId}\`,
    body: [
      "SiteScope analysis request (auto-processed).",
      "",
      "\`\`\`json",
      payload,
      "\`\`\`",
    ].join("\\n"),
  });

  const url = \`https://github.com/\${owner}/\${name}/issues/new?\${params.toString()}\`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function startAnalysis(
  reportId: string,
  targetUrl: string,
  options: AnalysisStartOptions = {},
): Promise<StartMode> {
  const token = process.env.NEXT_PUBLIC_QUEUE_DISPATCH_TOKEN?.trim();
  if (token) {
    await dispatchAnalysis(reportId, targetUrl, options, token);
    return "dispatch";
  }
  openAnalysisIssue(reportId, targetUrl, options);
  return "issue";
}

export function hasDispatchToken(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_QUEUE_DISPATCH_TOKEN?.trim());
}
`,
);

// Patch analysis-config for trace mode
const cfgPath = path.join(root, "scripts/analysis/analysis-config.mjs");
let cfg = fs.readFileSync(cfgPath, "utf8").replace(/\r\n/g, "\n");
if (!cfg.includes("runtimeTraceMode")) {
  cfg = cfg.replace(
    "let runtimeMaxDepth = null;",
    `let runtimeMaxDepth = null;
/** @type {'failure' | 'all' | 'off'} */
let runtimeTraceMode = "failure";

export function setRuntimeTraceMode(mode) {
  if (mode === "all" || mode === "off" || mode === "failure") {
    runtimeTraceMode = mode;
  }
}

export function getRuntimeTraceMode() {
  return runtimeTraceMode;
}`,
  );
  fs.writeFileSync(cfgPath, cfg);
  console.log("patched analysis-config trace");
}

// Patch run-analysis
const runPath = path.join(root, "scripts/run-analysis.mjs");
let run = fs.readFileSync(runPath, "utf8").replace(/\r\n/g, "\n");

if (!run.includes("setRuntimeTraceMode")) {
  run = run.replace(
    "  setRuntimeCrawlLimits,\n  setRuntimeDeviceProfile,",
    "  setRuntimeCrawlLimits,\n  setRuntimeDeviceProfile,\n  setRuntimeTraceMode,",
  );
  run = run.replace(
    "function parseOptionalInt(value) {",
    `function parseTraceMode(value) {
  if (value === "all" || value === "off" || value === "failure") return value;
  return "failure";
}

function parseOptionalInt(value) {`,
  );
  run = run.replace(
    "  maxDepth,\n}) {",
    "  maxDepth,\n  traceMode,\n}) {",
  );
  run = run.replace(
    "      maxDepth: parseOptionalInt(data.maxDepth),\n    };",
    "      maxDepth: parseOptionalInt(data.maxDepth),\n      traceMode: parseTraceMode(data.traceMode),\n    };",
  );
  run = run.replace(
    "      maxDepth: parseOptionalInt(maxDepth),\n    };",
    "      maxDepth: parseOptionalInt(maxDepth),\n      traceMode: parseTraceMode(traceMode),\n    };",
  );
  run = run.replace(
    '"max-depth": { type: "string" },\n    },',
    '"max-depth": { type: "string" },\n      "trace-mode": { type: "string" },\n    },',
  );
  run = run.replace(
    "  const maxDepthArg =\n    process.env.SITE_SCOPE_MAX_DEPTH || values[\"max-depth\"];",
    `  const maxDepthArg =
    process.env.SITE_SCOPE_MAX_DEPTH || values["max-depth"];
  const traceModeArg =
    process.env.TRACE_MODE || values["trace-mode"];`,
  );
  run = run.replace(
    "  const { reportId, targetUrl, deviceProfile, maxPages, maxDepth } = await readRequest({",
    "  const { reportId, targetUrl, deviceProfile, maxPages, maxDepth, traceMode } = await readRequest({",
  );
  run = run.replace(
    "    maxDepth: maxDepthArg,\n  });",
    "    maxDepth: maxDepthArg,\n    traceMode: traceModeArg,\n  });",
  );
  run = run.replace(
    "  setRuntimeCrawlLimits({ maxPages, maxDepth });",
    "  setRuntimeCrawlLimits({ maxPages, maxDepth });\n  setRuntimeTraceMode(traceMode);",
  );
  run = run.replace(
    "        maxDepth: ANALYSIS_CONFIG.crawl.maxDepth,\n      },",
    `        maxDepth: ANALYSIS_CONFIG.crawl.maxDepth,
        traceMode: traceMode,
      },`,
  );
  fs.writeFileSync(runPath, run);
  console.log("patched run-analysis");
}

// Patch page-analyzer trace
const paPath = path.join(root, "scripts/analysis/page-analyzer.mjs");
let pa = fs.readFileSync(paPath, "utf8").replace(/\r\n/g, "\n");
if (!pa.includes("getRuntimeTraceMode")) {
  pa = pa.replace(
    'import { ANALYSIS_CONFIG } from "./analysis-config.mjs";',
    'import { ANALYSIS_CONFIG, getRuntimeTraceMode } from "./analysis-config.mjs";',
  );
  pa = pa.replace(
    "import path from \"node:path\";",
    "import path from \"node:path\";\nimport fsSync from \"node:fs\";",
  );
  pa = pa.replace(
    "  const context = await browser.newContext(\n    playwrightContextOptions(deviceProfile),\n  );\n\n  const page = await context.newPage();",
    `  const traceMode = getRuntimeTraceMode();
  const context = await browser.newContext(
    playwrightContextOptions(deviceProfile),
  );

  const traceDir = path.join(reportsAbsDir, "traces");
  const urlSafe = crypto.createHash("sha1").update(url).digest("hex").slice(0, 12);
  const traceZip = path.join(traceDir, \`\${urlSafe}.zip\`);
  let tracingStarted = false;
  if (traceMode !== "off") {
    fsSync.mkdirSync(traceDir, { recursive: true });
    await context.tracing.start({ screenshots: true, snapshots: true });
    tracingStarted = true;
  }

  const page = await context.newPage();`,
  );
  // Before context.close - find finally or end of function
  pa = pa.replace(
    "  } finally {\n    await context.close();\n  }",
    `  } finally {
    if (tracingStarted) {
      try {
        const saveTrace =
          traceMode === "all" ||
          (traceMode === "failure" &&
            (consoleErrors.length > 0 ||
              jsExceptions.length > 0 ||
              failedRequests.length > 0));
        if (saveTrace) {
          await context.tracing.stop({ path: traceZip });
        } else {
          await context.tracing.stop();
        }
      } catch {
        try {
          await context.tracing.stop();
        } catch {
          /* ignore */
        }
      }
    }
    await context.close();
  }`,
  );
  fs.writeFileSync(paPath, pa);
  console.log("patched page-analyzer");
}

// queue-request.yml
write(
  ".github/workflows/queue-request.yml",
  `name: Queue SiteScope analysis

on:
  repository_dispatch:
    types: [sitescope-analyze]
  workflow_dispatch:
    inputs:
      report_id:
        description: Report UUID
        required: true
        type: string
      target_url:
        description: URL to analyze
        required: true
        type: string

permissions:
  contents: write

jobs:
  queue:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: \${{ secrets.GH_PAT || github.token }}

      - name: Resolve report metadata
        id: meta
        shell: bash
        run: |
          set -euo pipefail
          if [[ "\${{ github.event_name }}" == "workflow_dispatch" ]]; then
            REPORT_ID="\${{ github.event.inputs.report_id }}"
            TARGET_URL="\${{ github.event.inputs.target_url }}"
            DEVICE_PROFILE="desktop"
            MAX_PAGES="20"
            MAX_DEPTH="2"
            TRACE_MODE="failure"
          else
            REPORT_ID="\${{ github.event.client_payload.reportId }}"
            TARGET_URL="\${{ github.event.client_payload.targetUrl }}"
            DEVICE_PROFILE="\${{ github.event.client_payload.deviceProfile }}"
            MAX_PAGES="\${{ github.event.client_payload.maxPages }}"
            MAX_DEPTH="\${{ github.event.client_payload.maxDepth }}"
            TRACE_MODE="\${{ github.event.client_payload.traceMode }}"
          fi
          if [[ "\${DEVICE_PROFILE}" != "mobile" ]]; then
            DEVICE_PROFILE="desktop"
          fi
          if [[ -z "\${MAX_PAGES}" ]]; then MAX_PAGES="20"; fi
          if [[ -z "\${MAX_DEPTH}" ]]; then MAX_DEPTH="2"; fi
          if [[ -z "\${TRACE_MODE}" ]]; then TRACE_MODE="failure"; fi
          if [[ "\${TRACE_MODE}" != "all" && "\${TRACE_MODE}" != "off" ]]; then
            TRACE_MODE="failure"
          fi
          if [[ "\${REPORT_ID}" == "" || "\${TARGET_URL}" == "" ]]; then
            echo "Missing reportId or targetUrl in dispatch payload."
            exit 1
          fi
          echo "report_id=\${REPORT_ID}" >> "\$GITHUB_OUTPUT"
          echo "target_url=\${TARGET_URL}" >> "\$GITHUB_OUTPUT"
          echo "device_profile=\${DEVICE_PROFILE}" >> "\$GITHUB_OUTPUT"
          echo "max_pages=\${MAX_PAGES}" >> "\$GITHUB_OUTPUT"
          echo "max_depth=\${MAX_DEPTH}" >> "\$GITHUB_OUTPUT"
          echo "trace_mode=\${TRACE_MODE}" >> "\$GITHUB_OUTPUT"

      - name: Create request and initial status
        shell: bash
        env:
          REPORT_ID: \${{ steps.meta.outputs.report_id }}
          TARGET_URL: \${{ steps.meta.outputs.target_url }}
          DEVICE_PROFILE: \${{ steps.meta.outputs.device_profile }}
          MAX_PAGES: \${{ steps.meta.outputs.max_pages }}
          MAX_DEPTH: \${{ steps.meta.outputs.max_depth }}
          TRACE_MODE: \${{ steps.meta.outputs.trace_mode }}
        run: |
          set -euo pipefail
          NOW="\$(date -u +%Y-%m-%dT%H:%M:%SZ)"
          mkdir -p "requests" "public/reports/\${REPORT_ID}/screenshots"
          printf '%s\\n' "{" \\
            "  \\"reportId\\": \\"\${REPORT_ID}\\"," \\
            "  \\"targetUrl\\": \\"\${TARGET_URL}\\"," \\
            "  \\"deviceProfile\\": \\"\${DEVICE_PROFILE}\\"," \\
            "  \\"maxPages\\": \${MAX_PAGES}," \\
            "  \\"maxDepth\\": \${MAX_DEPTH}," \\
            "  \\"traceMode\\": \\"\${TRACE_MODE}\\"," \\
            "  \\"createdAt\\": \\"\${NOW}\\"" \\
            "}" > "requests/\${REPORT_ID}.json"
          printf '%s\\n' "{" \\
            "  \\"reportId\\": \\"\${REPORT_ID}\\"," \\
            "  \\"targetUrl\\": \\"\${TARGET_URL}\\"," \\
            "  \\"phase\\": \\"queued\\"," \\
            "  \\"updatedAt\\": \\"\${NOW}\\"" \\
            "}" > "public/reports/\${REPORT_ID}/status.json"

      - name: Commit and push queue files
        shell: bash
        run: |
          set -euo pipefail
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add "requests/\${{ steps.meta.outputs.report_id }}.json" \\
            "public/reports/\${{ steps.meta.outputs.report_id }}/status.json"
          if git diff --staged --quiet; then
            echo "Queue files already exist; skipping commit."
            exit 0
          fi
          git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>" -m "chore: queue SiteScope analysis \${{ steps.meta.outputs.report_id }}"
          git push
`,
);

// analyze-and-publish - remove hardcoded max pages 12
const wfPath = path.join(root, ".github/workflows/analyze-and-publish.yml");
let wf = fs.readFileSync(wfPath, "utf8").replace(/\r\n/g, "\n");
wf = wf.replace(
  `  SITE_SCOPE_FAST: "1"
  SITE_SCOPE_MAX_PAGES: "12"`,
  `  SITE_SCOPE_FAST: "1"`,
);
fs.writeFileSync(wfPath, wf);
console.log("patched analyze-and-publish.yml");

console.log("Phase 3 base patch done");