"use client";

import { useState } from "react";
import { LeadModal } from "@/components/LeadModal";

type Props = {
  reportId: string;
  targetUrl: string;
};

export function PdfDownloadButton({ reportId, targetUrl }: Props) {
  const [open, setOpen] = useState(false);

  const downloadPdf = () => {
    window.print();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium text-fg shadow-cardSm hover:border-accent-dim/40"
      >
        PDF 다운로드
      </button>
      <LeadModal
        open={open}
        mode="pdf"
        reportId={reportId}
        defaultSiteUrl={targetUrl}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setTimeout(downloadPdf, 300);
        }}
      />
    </>
  );
}
