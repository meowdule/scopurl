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
      <div className="mt-5 rounded-xl border border-accent-dim/25 bg-accent-soft/25 px-4 py-4 print:hidden">
        <p className="text-sm font-semibold text-fg">
          더 자세한 분석이 필요하신가요?
        </p>
        <ul className="mt-2 grid gap-1 text-xs text-fg-muted sm:grid-cols-2">
          <li>· 최대 100페이지 분석</li>
          <li>· 사용자 흐름 분석</li>
          <li>· 폼 분석</li>
          <li>· SEO 상세 진단</li>
        </ul>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dim"
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
