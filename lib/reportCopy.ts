/** Non-developer Korean copy for report UI. */

export const QUICK_SIGNAL_LABELS = {
  dns: { title: "도메인 연결", ok: "정상", fail: "확인 필요" },
  http: { title: "웹 접속", ok: "정상", fail: "확인 필요" },
  tls: { title: "보안(HTTPS)", ok: "적용됨", fail: "확인 필요" },
} as const;

export function humanizeQuickDetail(
  kind: "dns" | "http" | "tls",
  detail?: string,
  httpStatus?: number,
): string | undefined {
  if (kind === "dns") {
    if (!detail) return undefined;
    if (/resolve/i.test(detail)) return "도메인 주소가 정상적으로 연결됩니다.";
    return detail;
  }
  if (kind === "http") {
    if (httpStatus != null) return `페이지에 접속했습니다. (응답 ${httpStatus})`;
    return detail;
  }
  if (kind === "tls") {
    if (!detail) return undefined;
    if (/HTTPS/i.test(detail)) return "안전한 HTTPS 연결을 사용합니다.";
    return detail;
  }
  return detail;
}

const PHASE_LABELS: Record<string, string> = {
  browser_launch: "분석 준비",
  quick_scan: "빠른 연결 점검",
  crawl: "페이지 모으기",
  page_analysis: "페이지 품질 분석",
  report_generation: "리포트 작성",
  initial_load: "첫 화면 열기",
  lighthouse: "로딩·성능 측정",
  accessibility_scan: "접근성 점검",
  screenshots: "화면 캡처",
  hydration_wait: "화면 로딩 대기",
  ui_signals_mobile: "모바일 화면 점검",
  ui_signals_desktop: "데스크톱 화면 점검",
  interaction_discovery: "버튼·링크 탐색",
};

const SUMMARY_LINE_RULES: { pattern: RegExp; label: string }[] = [
  { pattern: /page analysis/i, label: "페이지 품질 분석" },
  { pattern: /lighthouse/i, label: "로딩·성능 측정" },
  { pattern: /quick scan/i, label: "빠른 연결 점검" },
  { pattern: /interaction.*crawl|crawl.*interaction/i, label: "버튼·링크 따라가기" },
  { pattern: /crawl|collect/i, label: "사이트 페이지 모으기" },
  { pattern: /accessibility/i, label: "접근성 점검" },
  { pattern: /screenshot/i, label: "화면 캡처" },
  { pattern: /hydration/i, label: "화면 로딩 대기" },
  { pattern: /browser launch/i, label: "분석 준비" },
  { pattern: /ui_signals_desktop/i, label: "데스크톱 화면 점검" },
  { pattern: /ui_signals_mobile/i, label: "모바일 화면 점검" },
  { pattern: /report generation/i, label: "리포트 작성" },
];

export function humanizeTimingSummaryLine(line: string): {
  label: string;
  seconds: number;
} {
  const match = line.match(/([\d.]+)\s*s/i);
  const seconds = match ? parseFloat(match[1]) : 0;
  for (const rule of SUMMARY_LINE_RULES) {
    if (rule.pattern.test(line)) {
      return { label: rule.label, seconds };
    }
  }
  const cleaned = line.replace(/\(pages\)|\(total\)/gi, "").replace(/:\s*[\d.]+s.*/i, "").trim();
  return { label: cleaned || line, seconds };
}

export function humanizePhaseKey(key: string): string {
  return PHASE_LABELS[key] || key.replace(/_/g, " ");
}

export function statusSummaryText(
  status: "Good" | "Warning" | "Critical" | undefined,
  score: number,
): string {
  if (status === "Good") return `${score}점 — 전반적으로 양호합니다. 세부 항목을 점검해 보세요.`;
  if (status === "Warning") return `${score}점 — 개선하면 좋을 부분이 있습니다.`;
  if (status === "Critical") return `${score}점 — 우선 조치가 필요한 항목이 있습니다.`;
  return `${score}점`;
}
