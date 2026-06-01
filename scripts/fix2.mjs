import fs from "node:fs";
const f = "scripts/run-analysis.mjs";
let s = fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
if (!s.includes("retentionExpiresAt")) {
  s = s.replace(
    "setRuntimeDeviceProfile,\n} from \"./analysis/analysis-config.mjs\";",
    "retentionExpiresAt,\n  setRuntimeCrawlLimits,\n  setRuntimeDeviceProfile,\n} from \"./analysis/analysis-config.mjs\";",
  );
}
if (!s.includes("device: { type")) {
  s = s.replace(
    '"target-url": { type: "string" },\n    },',
    '"target-url": { type: "string" },\n      device: { type: "string" },\n      "max-pages": { type: "string" },\n      "max-depth": { type: "string" },\n    },',
  );
}
const blockOld = "  const { reportId, targetUrl, deviceProfile } = await readRequest({\n    requestFile,\n    reportId: reportIdArg,\n    targetUrl: targetArg,\n  });\n\n  setRuntimeDeviceProfile(deviceProfile);";
const blockNew = "  const deviceArg = process.env.SITE_SCOPE_DEVICE || values.device;\n  const maxPagesArg = process.env.SITE_SCOPE_MAX_PAGES || values[\"max-pages\"];\n  const maxDepthArg = process.env.SITE_SCOPE_MAX_DEPTH || values[\"max-depth\"];\n\n  const { reportId, targetUrl, deviceProfile, maxPages, maxDepth } = await readRequest({\n    requestFile,\n    reportId: reportIdArg,\n    targetUrl: targetArg,\n    device: deviceArg,\n    maxPages: maxPagesArg,\n    maxDepth: maxDepthArg,\n  });\n\n  setRuntimeDeviceProfile(deviceProfile);\n  setRuntimeCrawlLimits({ maxPages, maxDepth });";
if (s.includes(blockOld)) s = s.replace(blockOld, blockNew);
else console.error("main block not found");
if (!s.includes("const createdAt")) {
  s = s.replace("  const timer = new AnalysisTimer();\n\n  await writeStatus(reportId, {", "  const timer = new AnalysisTimer();\n  const createdAt = new Date().toISOString();\n\n  await writeStatus(reportId, {");
}
if (!s.includes("expiresAt = retention")) {
  s = s.replace("    const completedAt = new Date().toISOString();\n    const timing = timer.toReport();", "    const completedAt = new Date().toISOString();\n    const expiresAt = retentionExpiresAt(completedAt);\n    const cardId = randomUUID();\n    const timing = timer.toReport();");
  s = s.replace("      createdAt: completedAt,\n      completedAt,\n      quick,", "      createdAt,\n      completedAt,\n      expiresAt,\n      cardId,\n      quick,");
  s = s.replace("      timing,\n    };", "      timing,\n      crawlLimits: {\n        maxPages: ANALYSIS_CONFIG.crawl.maxPages,\n        maxDepth: ANALYSIS_CONFIG.crawl.maxDepth,\n      },\n    };");
  s = s.replace('      phase: "complete",\n      quick,\n    });', '      phase: "complete",\n      quick,\n      expiresAt,\n    });');
}
s = s.replace("    const deviceProfile =\n      data.deviceProfile === \"mobile\" ? \"mobile\" : \"desktop\";\n    return {\n      reportId: data.reportId,\n      targetUrl: data.targetUrl,\n      deviceProfile,\n    };", "    return {\n      reportId: data.reportId,\n      targetUrl: data.targetUrl,\n      deviceProfile: parseDeviceProfile(data.deviceProfile),\n      maxPages: parseOptionalInt(data.maxPages),\n      maxDepth: parseOptionalInt(data.maxDepth),\n    };");
if (s.includes('deviceProfile: "desktop"')) {
  s = s.replace("  if (reportId && targetUrl) {\n    return { reportId, targetUrl, deviceProfile: \"desktop\" };\n  }", "  if (reportId && targetUrl) {\n    return {\n      reportId,\n      targetUrl,\n      deviceProfile: parseDeviceProfile(device),\n      maxPages: parseOptionalInt(maxPages),\n      maxDepth: parseOptionalInt(maxDepth),\n    };\n  }");
}
fs.writeFileSync(f, s);
console.log({ retention: s.includes("retentionExpiresAt"), crawlLimits: s.includes("crawlLimits"), expiresAt: s.includes("expiresAt = retention") });