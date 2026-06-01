/** UI copy (Unicode escapes for reliable UTF-8 on all platforms). */
export const analyzeFormStrings = {
  analyzing: "\uBD84\uC11D \uC911\u2026",
  waitEstimate: "\uC608\uC0C1 \uB300\uAE30 \uC2DC\uAC04 \uC57D 3-8\uBD84",
  deviceSize: "\uBD84\uC11D \uD654\uBA74 \uD06C\uAE30",
  desktop: "\uB370\uC2A4\uD06C\uD0B1 (1440px)",
  mobile: "\uBAA8\uBC14\uC77C (390px)",
  advancedOptions: "\uACE0\uAE09 \uBD84\uC11D \uC635\uC158",
  maxPages: (max: number) =>
    `\uCD5C\uB300 \uD398\uC774\uC9C0 (\uBB34\uB8CC 1-${max})`,
  maxDepth: "\uB9C1\uD06C \uAE4A\uC774 (0-10)",
  traceLabel: "\uC2E4\uD589 \uAE30\uB85D(\uD2B8\uB808\uC774\uC2A4)",
  traceFailure:
    "\uC2E4\uD328\uD55C \uD398\uC774\uC9C0\uB9CC \uAE30\uB85D (\uAD8C\uC7A5)",
  traceAll: "\uBAA8\uB4E0 \uD398\uC774\uC9C0 \uAE30\uB85D",
  traceOff: "\uAE30\uB85D \uC548 \uD568",
};
