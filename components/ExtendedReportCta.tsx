"use client";

import { useState } from "react";
import { LeadModal } from "@/components/LeadModal";
import { LeadSuccessDialog } from "@/components/LeadSuccessDialog";

type Props = {
  defaultSiteUrl?: string;
};

export function ExtendedReportCta({ defaultSiteUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <>
      <div className="panel mt-10 border-accent-dim/30 bg-accent-soft/30 print:hidden">
        <p className="text-base font-semibold text-fg">
          더 자세한 결과가 필요하신가요?
        </p>
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-fg-muted">
          <li>· 최대 100페이지 분석</li>
          <li>· 사용자 흐름 분석</li>
          <li>· 입력 폼 분석</li>
          <li>· SEO 상세 진단</li>
        </ul>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dim"
        >
          확장 분석 요청
        </button>
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
