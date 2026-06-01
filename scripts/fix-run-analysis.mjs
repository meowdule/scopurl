import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "run-analysis.mjs");
let s = fs.readFileSync(file, "utf8");

s = s.replace(
  `import {
  ANALYSIS_CONFIG,
  setRuntimeDeviceProfile,
} from "./analysis/analysis-config.mjs";`,
  `import {
  ANALYSIS_CONFIG,
  retentionExpiresAt,
  setRuntimeCrawlLimits,
  setRuntimeDeviceProfile,
} from "./analysis/analysis-config.mjs";`,
);

if (!s.includes('device: { type: "string" }')) {
  s = s.replace(
    `"target-url": { type: "string" },\n    },`,
    `"target-url": { type: "string" },\n      device: { type: "string" },\n      "max-pages": { type: "string" },\n      "max-depth": { type: "string" },\n    },`,
  );
}

s = s.replace(
  `  const { reportId, targetUrl, deviceProfile } = await readRequest({
    requestFile,
    reportId: reportIdArg,
    targetUrl: targetArg,
  });

  setRuntimeDeviceProfile(deviceProfile);`,
  `  const deviceArg = process.env.SITE_SCOPE_DEVICE || values.device;
  const maxPagesArg =
    process.env.SITE_SCOPE_MAX_PAGES || values["max-pages"];
  const maxDepthArg =
    process.env.SITE_SCOPE_MAX_DEPTH || values["max-depth"];

  const { reportId, targetUrl, deviceProfile, maxPages, maxDepth } =
    await readRequest({
      requestFile,
      reportId: reportIdArg,
      targetUrl: targetArg,
      device: deviceArg,
      maxPages: maxPagesArg,
      maxDepth: maxDepthArg,
    });

  setRuntimeDeviceProfile(deviceProfile);
  setRuntimeCrawlLimits({ maxPages, maxDepth });`,
);

if (!s.includes("const createdAt = new Date")) {
  s = s.replace(
    `  const timer = new AnalysisTimer();

  await writeStatus(reportId, {`,
    `  const timer = new AnalysisTimer();
  const createdAt = new Date().toISOString();

  await writeStatus(reportId, {`,
  );
}

if (!s.includes("const expiresAt = retentionExpiresAt")) {
  s = s.replace(
    `    const completedAt = new Date().toISOString();
    const timing = timer.toReport();`,
    `    const completedAt = new Date().toISOString();
    const expiresAt = retentionExpiresAt(completedAt);
    const cardId = randomUUID();
    const timing = timer.toReport();`,
  );
  s = s.replace(
    `      createdAt: completedAt,
      completedAt,
      quick,`,
    `      createdAt,
      completedAt,
      expiresAt,
      cardId,
      quick,`,
  );
  s = s.replace(
    `      timing,
    };`,
    `      timing,
      crawlLimits: {
        maxPages: ANALYSIS_CONFIG.crawl.maxPages,
        maxDepth: ANALYSIS_CONFIG.crawl.maxDepth,
      },
    };`,
  );
  s = s.replace(
    `      phase: "complete",
      quick,
    });`,
    `      phase: "complete",
      quick,
      expiresAt,
    });`,
  );
}

// fix readRequest request-file branch
s = s.replace(
  `    const deviceProfile =
      data.deviceProfile === "mobile" ? "mobile" : "desktop";
    return {
      reportId: data.reportId,
      targetUrl: data.targetUrl,
      deviceProfile,
    };`,
  `    return {
      reportId: data.reportId,
      targetUrl: data.targetUrl,
      deviceProfile: parseDeviceProfile(data.deviceProfile),
      maxPages: parseOptionalInt(data.maxPages),
      maxDepth: parseOptionalInt(data.maxDepth),
    };`,
);

if (!s.includes("deviceProfile: parseDeviceProfile(device)")) {
  s = s.replace(
    `  if (reportId && targetUrl) {
    return { reportId, targetUrl, deviceProfile: "desktop" };
  }`,
  `  if (reportId && targetUrl) {
    return {
      reportId,
      targetUrl,
      deviceProfile: parseDeviceProfile(device),
      maxPages: parseOptionalInt(maxPages),
      maxDepth: parseOptionalInt(maxDepth),
    };
  }`,
  );
}

fs.writeFileSync(file, s);
console.log("run-analysis.mjs fixed");
