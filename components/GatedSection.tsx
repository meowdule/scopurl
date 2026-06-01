"use client";

type Props = {
  title: string;
  description?: string;
  ctaLabel: string;
  onCta: () => void;
  children?: React.ReactNode;
};

export function GatedSection({
  title,
  description,
  ctaLabel,
  onCta,
  children,
}: Props) {
  return (
    <section className="relative mt-8 overflow-hidden rounded-xl border border-surface-border bg-surface-raised p-5">
      <div className="pointer-events-none select-none blur-sm">
        {children || (
          <div className="space-y-2 text-sm text-slate-400">
            <p>• 홈 → 탐색 → 상세 페이지</p>
            <p>• 폼 필드: 이름, 이메일, 문의 내용</p>
            <p>• 클릭·스크롤 후 노출된 경로</p>
          </div>
        )}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 px-6 text-center">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {description && (
          <p className="mt-2 max-w-md text-xs text-slate-400">{description}</p>
        )}
        <button
          type="button"
          onClick={onCta}
          className="mt-4 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white"
        >
          {ctaLabel}
        </button>
      </div>
    </section>
  );
}
