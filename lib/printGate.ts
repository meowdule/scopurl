/** body에 붙일 때만 @media print 에서 PDF 문서가 노출됩니다. */
export const PRINT_ALLOWED_CLASS = "print-allowed";

export async function runAuthorizedPrint(): Promise<void> {
  try {
    await document.fonts.ready;
  } catch {
    /* ignore */
  }

  document.body.classList.add(PRINT_ALLOWED_CLASS);
  const cleanup = () => document.body.classList.remove(PRINT_ALLOWED_CLASS);
  window.addEventListener("afterprint", cleanup, { once: true });

  window.print();
}
