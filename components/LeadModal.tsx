"use client";

import { useEffect, useState } from "react";
import type { LeadMode } from "@/lib/leadSubmit";
import { submitLead } from "@/lib/leadSubmit";

type Props = {
  open: boolean;
  mode: LeadMode;
  defaultSiteUrl?: string;
  reportId?: string;
  onClose: () => void;
  onSuccess: (mode: LeadMode) => void;
};

const MODE_TITLES: Record<LeadMode, string> = {
  pdf: "PDF 리포트 받기",
  solution: "솔루션 문의",
  extended: "확장 분석 요청 (최대 100페이지)",
  general: "업데이트 구독",
};

export function LeadModal({
  open,
  mode,
  defaultSiteUrl,
  reportId,
  onClose,
  onSuccess,
}: Props) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [siteUrl, setSiteUrl] = useState(defaultSiteUrl || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSiteUrl(defaultSiteUrl || "");
      setError(null);
    }
  }, [open, defaultSiteUrl]);

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("이메일을 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitLead({
        mode,
        email: email.trim(),
        company: company.trim() || undefined,
        name: name.trim() || undefined,
        siteUrl: siteUrl.trim() || undefined,
        message: message.trim() || undefined,
        reportId,
      });
      onSuccess(mode);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "제출에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-card-border bg-card p-6 shadow-card"
      >
        <h2 className="text-lg font-semibold text-fg">{MODE_TITLES[mode]}</h2>
        <p className="mt-1 text-sm text-fg-muted">
          {mode === "pdf"
            ? "이메일 제출 후 PDF를 바로 다운로드할 수 있습니다."
            : mode === "extended"
              ? "담당자가 검토 후 연락드립니다."
              : "담당자가 검토 후 별도로 연락드릴 예정입니다."}
        </p>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-4">
          <Field label="이메일 (필수)">
            <input
              type="email"
              required
              autoFocus={mode === "pdf"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-card-border bg-page px-3 py-2 text-sm text-fg"
            />
          </Field>
          {(mode === "solution" || mode === "extended" || mode === "general") && (
            <Field label="회사명 (선택)">
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-1 w-full rounded-lg border border-card-border bg-page px-3 py-2 text-sm text-fg"
              />
            </Field>
          )}
          {(mode === "solution" || mode === "general") && (
            <Field label="이름 (선택)">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-card-border bg-page px-3 py-2 text-sm text-fg"
              />
            </Field>
          )}
          {mode === "extended" && (
            <>
              <Field label="사이트 URL">
                <input
                  type="url"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-card-border bg-page px-3 py-2 text-sm text-fg"
                />
              </Field>
              <Field label="요청 내용 (선택)">
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-card-border bg-page px-3 py-2 text-sm text-fg"
                />
              </Field>
            </>
          )}
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-fg"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "제출 중…" : "제출"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-fg-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
