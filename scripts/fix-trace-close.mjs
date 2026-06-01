import fs from "node:fs";
const paPath = "scripts/analysis/page-analyzer.mjs";
let pa = fs.readFileSync(paPath, "utf8").replace(/\r\n/g, "\n");
if (!pa.includes("tracingStarted") || pa.includes("saveTrace")) {
  console.log("trace close already patched or tracing missing");
  process.exit(0);
}
pa = pa.replace(
  `  await page.close();
  await context.close();`,
  `  await page.close();
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
  await context.close();`,
);
fs.writeFileSync(paPath, pa);
console.log("fixed trace stop before close");