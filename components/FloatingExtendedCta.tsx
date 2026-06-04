"use client";

import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { LeadModal } from "@/components/LeadModal";
import { LeadSuccessDialog } from "@/components/LeadSuccessDialog";
import { REPORT_SECTION } from "@/lib/reportSections";
import { ReportIcon } from "@/lib/reportIcons";

type Props = {
  defaultSiteUrl?: string;
};

const FEATURES = [
  "최대 100페이지 분석",
  "사용자 흐름 분석",
  "폼 분석",
  "SEO 상세 진단",
];

export function FloatingExtendedCta({ defaultSiteUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <>
      <div
        id={REPORT_SECTION.extendedCta}
        data-report-section={REPORT_SECTION.extendedCta}
        className="extended-cta-dock print:hidden"
        role="complementary"
        aria-label="확장 분석 요청"
      >
        <div className="extended-cta-glow" aria-hidden />
        <div className="extended-cta-panel">
          <div className="extended-cta-copy">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eafbf3] text-accent-dim">
                <ReportIcon icon={Sparkles} size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg sm:text-base">
                  더 자세한 분석이 필요하신가요?
                </p>
                <ul className="mt-2 hidden gap-x-3 gap-y-1 text-xs text-fg-muted sm:flex sm:flex-wrap">
                  {FEATURES.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-fg-muted sm:hidden">
                  {FEATURES.join(" · ")}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="extended-cta-btn"
          >
            확장 분석 요청
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      <LeadModal
        open={open}
        mode="extended"
        defaultSiteUrl={defaultSiteUrl}
        onClose={() => setOpen(false)}
        onSuccess={() => setSuccess(true)}
      />
      <LeadSuccessDialog open={success} onClose={() => setSuccess(false)} />
    </>
  );
}
