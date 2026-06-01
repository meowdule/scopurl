#!/usr/bin/env node
import { detectErrorCode } from "../analysis/error-codes.mjs";

const cases = [
  {
    name: "dns_fail",
    msg: "getaddrinfo ENOTFOUND",
    quick: { dnsOk: false },
    want: "dns_fail",
  },
  {
    name: "http_403",
    msg: "blocked",
    quick: { httpStatus: 403, finalUrl: "https://example.com" },
    want: "http_403",
  },
  {
    name: "cloudflare",
    msg: "challenge",
    quick: { httpStatus: 403, finalUrl: "https://x.cdn-cgi/challenge" },
    want: "cloudflare",
  },
  {
    name: "timeout",
    msg: "Navigation timed out after 45000ms",
    quick: { dnsOk: true },
    want: "timeout",
  },
  {
    name: "unknown",
    msg: "something else",
    quick: { dnsOk: true },
    want: "unknown",
  },
];

let failed = 0;
for (const c of cases) {
  const got = detectErrorCode(c.msg, c.quick);
  if (got !== c.want) {
    console.error(`FAIL ${c.name}: want ${c.want}, got ${got}`);
    failed++;
  } else {
    console.log(`OK ${c.name}`);
  }
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log(`All ${cases.length} error-code tests passed.`);
}
