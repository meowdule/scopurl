import fs from "node:fs";
const p = "components/AnalyzeForm.tsx";
let s = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

// Ensure imports
if (!s.includes("@/lib/analysisOptions")) {
  s = s.replace(
    `import {
  hasDispatchToken,
  startAnalysis,
  type DeviceProfile,
  type TraceMode,
} from "@/lib/startAnalysis";`,
    `import {
  hasDispatchToken,
  startAnalysis,
  type TraceMode,
} from "@/lib/startAnalysis";
import type { DeviceProfile } from "@/lib/startAnalysis";
import {
  clampMaxDepth,
  clampMaxPages,
  DEFAULT_MAX_DEPTH,
  DEFAULT_MAX_PAGES,
  DEFAULT_TRACE_MODE,
  FREE_MAX_PAGES,
} from "@/lib/analysisOptions";`,
  );
}

// Add state if missing
if (!s.includes("const [maxPages")) {
  s = s.replace(
    `  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>("desktop");`,
    `  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile>("desktop");
  const [maxPages, setMaxPages] = useState(DEFAULT_MAX_PAGES);
  const [maxDepth, setMaxDepth] = useState(DEFAULT_MAX_DEPTH);
  const [traceMode, setTraceMode] = useState<TraceMode>(DEFAULT_TRACE_MODE);`,
  );
}

// Replace startAnalysis call (DeviceProfile -> options)
s = s.replace(
  /await startAnalysis\(id, v\.normalized, deviceProfile\);/g,
  `await startAnalysis(id, v.normalized, {
        deviceProfile,
        maxPages: clampMaxPages(maxPages),
        maxDepth: clampMaxDepth(maxDepth),
        traceMode,
      });`,
);

// Ensure deps include new state
s = s.replace(
  /\}, \[deviceProfile, onReportReady, pollLoop, runInstantChecks, urlInput\]\);/g,
  `}, [deviceProfile, maxDepth, maxPages, onReportReady, pollLoop, runInstantChecks, traceMode, urlInput]);`,
);

// Insert options UI
if (!s.includes("고급 분석 옵션")) {
  const optionsBlock = `

      <details className="rounded-lg border border-surface-border bg-surface-raised/50 px-4 py-3 text-sm">
        <summary className="cursor-pointer select-none text-slate-300">
          고급 분석 옵션
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-slate-400">최대 페이지 (무료 1–{FREE_MAX_PAGES})</span>
            <input
              type="number"
              min={1}
              max={FREE_MAX_PAGES}
              value={maxPages}
              disabled={busy}
              onChange={(e) => setMaxPages(clampMaxPages(e.target.value))}
              className="mt-1 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-slate-100"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">링크 깊이 (0–10)</span>
            <input
              type="number"
              min={0}
              max={10}
              value={maxDepth}
              disabled={busy}
              onChange={(e) => setMaxDepth(clampMaxDepth(e.target.value))}
              className="mt-1 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-slate-100"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-slate-400">실행 기록(트레이스)</span>
            <select
              value={traceMode}
              disabled={busy}
              onChange={(e) => setTraceMode(e.target.value as TraceMode)}
              className="mt-1 w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-slate-100"
            >
              <option value="failure">실패한 페이지만 기록 (권장)</option>
              <option value="all">모든 페이지 기록</option>
              <option value="off">기록 안 함</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              CI 디버깅용입니다. 리포트 화면에는 표시되지 않습니다.
            </p>
          </label>
        </div>
      </details>
`;

  s = s.replace(
    `      </div>

      {!hasDispatchToken()`,
    `      </div>${optionsBlock}

      {!hasDispatchToken()`,
  );
}

fs.writeFileSync(p, s);
console.log("AnalyzeForm updated");