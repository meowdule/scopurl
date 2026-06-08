"use client";

import { useEffect } from "react";

/** 리포트 화면에서 Ctrl+P 등 무분별 인쇄 차단 (PDF 다운로드 경로만 허용) */
export function ReportPrintGate() {
  useEffect(() => {
    const blockShortcut = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "p") return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };

    window.addEventListener("keydown", blockShortcut, { capture: true });
    return () => window.removeEventListener("keydown", blockShortcut, { capture: true });
  }, []);

  return null;
}
