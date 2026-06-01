"use client";

import { useEffect, useState } from "react";
import { LeadModal } from "@/components/LeadModal";
import { LeadSuccessDialog } from "@/components/LeadSuccessDialog";

type Props = {
  shake?: boolean;
};

export function FloatingLeadButton({ shake }: Props) {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!shake) return;
    const el = document.getElementById("fab-lead");
    el?.classList.add("animate-shake");
    const t = setTimeout(() => el?.classList.remove("animate-shake"), 1200);
    return () => clearTimeout(t);
  }, [shake]);

  return (
    <>
      <button
        id="fab-lead"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="구독 및 문의"
        className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl shadow-lg transition hover:bg-accent-muted ${
          shake ? "animate-shake" : ""
        }`}
      >
        ✈️
      </button>
      <LeadModal
        open={open}
        mode="general"
        onClose={() => setOpen(false)}
        onSuccess={() => setSuccess(true)}
      />
      <LeadSuccessDialog open={success} onClose={() => setSuccess(false)} />
    </>
  );
}
