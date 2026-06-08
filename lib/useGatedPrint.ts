"use client";

import { useCallback, useRef, useState } from "react";
import { runAuthorizedPrint } from "@/lib/printGate";

/** PDF 다운로드 버튼 전용 — 이메일 제출 후에만 인쇄 허용 */
export function useGatedPrint() {
  const [open, setOpen] = useState(false);
  const pendingPrintRef = useRef(false);

  const requestPrint = useCallback(() => {
    pendingPrintRef.current = true;
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    pendingPrintRef.current = false;
    setOpen(false);
  }, []);

  const onLeadSuccess = useCallback(() => {
    setOpen(false);
    if (pendingPrintRef.current) {
      pendingPrintRef.current = false;
      setTimeout(() => void runAuthorizedPrint(), 300);
    }
  }, []);

  return { open, requestPrint, close, onLeadSuccess };
}
