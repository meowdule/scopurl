"use client";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function LeadSuccessDialog({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-surface-border bg-surface-raised p-6 text-center shadow-xl">
        <p className="text-lg font-semibold text-white">문의가 접수되었습니다</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          문의가 정상적으로 접수되었습니다. 담당자가 검토 후 별도로 연락드릴
          예정입니다. 감사합니다.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          확인
        </button>
      </div>
    </div>
  );
}
