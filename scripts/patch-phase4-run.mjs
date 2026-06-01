import fs from "node:fs";
const p = "scripts/run-analysis.mjs";
let s = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");

if (!s.includes("function detectErrorCode")) {
  s = s.replace(
    "async function main() {",
`function phaseWaitLabel(phase) {
  const map = {
    queued: "예상 대기 시간 약 3-8분",
    quick: "빠른 점검 중 (약 1분)",
    crawling: "페이지 수집 중 (약 1-3분)",
    analyzing: "심층 분석 중 (약 2-6분)",
  };
  return map[phase] || undefined;
}

function detectErrorCode(message, quick) {
  const m = String(message || "").toLowerCase();
  if (quick?.dnsOk === false) return "dns_fail";
  if (quick?.httpStatus === 403) {
    if (String(quick?.finalUrl || "").includes("cdn-cgi") || m.includes("cloudflare")) return "cloudflare";
    return "http_403";
  }
  if (m.includes("timeout") || m.includes("timed out") || m.includes("45000")) return "timeout";
  if (m.includes("cloudflare") || String(quick?.finalUrl || "").includes("cdn-cgi")) return "cloudflare";
  return "unknown";
}

async function main() {`,
  );
}

s = s.replace(
`  await writeStatus(reportId, {
    targetUrl,
    phase: "queued",
    quick: undefined,
    error: undefined,
  });`,
`  await writeStatus(reportId, {
    targetUrl,
    phase: "queued",
    quick: undefined,
    error: undefined,
    estimatedWaitLabel: phaseWaitLabel("queued"),
  });`,
);

s = s.replace(
`    await writeStatus(reportId, {
      targetUrl,
      phase: "quick",
      quick,
    });`,
`    await writeStatus(reportId, {
      targetUrl,
      phase: "quick",
      quick,
      estimatedWaitLabel: phaseWaitLabel("quick"),
    });`,
);

s = s.replace(
`    await writeStatus(reportId, {
      targetUrl,
      phase: "crawling",
      quick,
    });`,
`    await writeStatus(reportId, {
      targetUrl,
      phase: "crawling",
      quick,
      estimatedWaitLabel: phaseWaitLabel("crawling"),
    });`,
);

s = s.replace(
`    await writeStatus(reportId, {
      targetUrl,
      phase: "analyzing",
      quick,
    });`,
`    await writeStatus(reportId, {
      targetUrl,
      phase: "analyzing",
      quick,
      estimatedWaitLabel: phaseWaitLabel("analyzing"),
    });`,
);

if (!s.includes("quick?.httpStatus === 403")) {
  s = s.replace(
`    await writeStatus(reportId, {
      targetUrl,
      phase: "quick",
      quick,
      estimatedWaitLabel: phaseWaitLabel("quick"),
    });

    await writeStatus(reportId, {`,
`    await writeStatus(reportId, {
      targetUrl,
      phase: "quick",
      quick,
      estimatedWaitLabel: phaseWaitLabel("quick"),
    });

    if (quick?.dnsOk === false || quick?.httpStatus === 403 || quick?.error) {
      const quickError = quick?.error || `Quick check blocked (status ${quick?.httpStatus ?? "unknown"})`;
      const errorCode = detectErrorCode(quickError, quick);
      await writeStatus(reportId, {
        targetUrl,
        phase: "failed",
        quick,
        error: quickError,
        errorCode,
      });
      process.exitCode = 1;
      return;
    }

    await writeStatus(reportId, {`,
  );
}

s = s.replace(
`    await writeStatus(reportId, {
      targetUrl,
      phase: "complete",
      quick,
      expiresAt,
    });`,
`    await writeStatus(reportId, {
      targetUrl,
      phase: "complete",
      quick,
      expiresAt,
      estimatedWaitLabel: undefined,
    });`,
);

s = s.replace(
`  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await writeStatus(reportId, {
      targetUrl,
      phase: "failed",
      error: msg,
    });`,
`  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const errorCode = detectErrorCode(msg);
    await writeStatus(reportId, {
      targetUrl,
      phase: "failed",
      error: msg,
      errorCode,
    });`,
);

fs.writeFileSync(p, s);
console.log("patched run-analysis for phase4 status UX");