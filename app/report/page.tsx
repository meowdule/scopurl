"use client";

import { useEffect } from "react";
import { assetUrl } from "@/lib/paths";

/** v0.1: 상세 리포트는 홈에서만 표시. /report 딥링크는 홈으로 이동 */
export default function ReportRedirectPage() {
  useEffect(() => {
    window.location.replace(assetUrl("/"));
  }, []);

  return (
    <div className="px-4 py-20 text-center text-slate-400">
      리포트 화면으로 이동 중…
    </div>
  );
}
