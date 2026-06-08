"use client";

import { FileDown } from "lucide-react";
import { LeadModal } from "@/components/LeadModal";
import { useGatedPrint } from "@/lib/useGatedPrint";

type Props = {
  reportId: string;
  targetUrl: string;
};

export function PdfDownloadButton({ reportId, targetUrl }: Props) {
  const { open, requestPrint, close, onLeadSuccess } = useGatedPrint();

  return (
    <>
      <button type="button" onClick={requestPrint} className="btn-primary">
        <FileDown className="h-4 w-4" aria-hidden />
        PDF 다운로드
      </button>
      <LeadModal
        open={open}
        mode="pdf"
        reportId={reportId}
        defaultSiteUrl={targetUrl}
        onClose={close}
        onSuccess={onLeadSuccess}
      />
    </>
  );
}
