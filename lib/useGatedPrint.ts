"use client";

import { useCallback, useEffect, useRef, useState } from "react";

async function runPrint() {
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }
  window.print();
}

/** 이메일 제출 후 window.print() — PDF 버튼·Ctrl+P 공통 */
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
      setTimeout(() => void runPrint(), 300);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "p") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      pendingPrintRef.current = true;
      setOpen(true);
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, []);

  return { open, requestPrint, close, onLeadSuccess };
}
