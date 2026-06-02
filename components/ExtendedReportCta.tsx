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
      <div className="panel mt-8 border-accent-dim/30 bg-accent-soft/30">
        <p className="text-sm font-semibold text-fg">
          사이트 전체 분석이 필요하신가요?
        </p>
        <p className="mt-1 text-sm text-fg-muted">
          최대 100페이지 확장 리포트를 요청해 보세요.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dim"
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
