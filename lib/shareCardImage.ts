import { toPng } from "html-to-image";
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "@/lib/shareCardConstants";

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.download = filename;
  a.href = dataUrl;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** 공유 인증 카드 전용 — 1200×630 고정 */
export async function captureShareCardPng(
  el: HTMLElement,
  filename = "scopurl-score-card.png",
): Promise<void> {
  const dataUrl = await toPng(el, {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    skipFonts: false,
  });
  downloadDataUrl(dataUrl, filename);
}

export async function captureElementPng(
  el: HTMLElement,
  filename: string,
): Promise<void> {
  const rect = el.getBoundingClientRect();
  const dataUrl = await toPng(el, {
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    skipFonts: false,
  });
  downloadDataUrl(dataUrl, filename);
}
