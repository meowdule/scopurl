"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
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
        className="btn-primary"
      >
        <FileDown className="h-4 w-4" aria-hidden />
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
