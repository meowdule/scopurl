import { toPng } from "html-to-image";
import {
  SHARE_CARD_MAX_HEIGHT,
  SHARE_CARD_MIN_HEIGHT,
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

function resolveShareCardHeight(el: HTMLElement): number {
  const measured = Math.ceil(el.scrollHeight || el.getBoundingClientRect().height);
  return Math.min(
    SHARE_CARD_MAX_HEIGHT,
    Math.max(SHARE_CARD_MIN_HEIGHT, measured),
  );
}

/** 공유 인증 카드 전용 — 1200×630 기본, 내용 길면 최대 780까지 확장 */
export async function captureShareCardPng(
  el: HTMLElement,
  filename = "scopurl-score-card.png",
): Promise<void> {
  const height = resolveShareCardHeight(el);
  const dataUrl = await toPng(el, {
    width: SHARE_CARD_WIDTH,
    height,
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

export { SHARE_CARD_WIDTH, SHARE_CARD_MIN_HEIGHT, SHARE_CARD_MAX_HEIGHT };
