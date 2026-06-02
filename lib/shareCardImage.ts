import { toPng } from "html-to-image";

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.download = filename;
  a.href = dataUrl;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function captureViaCanvas(el: HTMLElement, filename: string): Promise<void> {
  const rect = el.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const scale = 2;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject x="0" y="0" width="100%" height="100%">
        ${el.outerHTML}
      </foreignObject>
    </svg>
  `.trim();

  const data = new XMLSerializer().serializeToString(
    new DOMParser().parseFromString(svg, "image/svg+xml").documentElement,
  );

  const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (b) => {
          if (!b) return reject(new Error("toBlob returned null"));
          const pngUrl = URL.createObjectURL(b);
          const a = document.createElement("a");
          a.download = filename;
          a.href = pngUrl;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
          resolve();
        },
        "image/png",
      );
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e instanceof Error ? e : new Error("Image load failed"));
    };
    img.src = url;
  });
}

export async function captureElementPng(
  el: HTMLElement,
  filename: string,
): Promise<void> {
  // 1) html-to-image (대부분 성공)
  try {
    const dataUrl = await toPng(el, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
      // 폰트/아이콘이 잘 안 먹는 경우가 있어 skipFonts를 꺼 둡니다.
      skipFonts: false,
    });
    downloadDataUrl(dataUrl, filename);
    return;
  } catch (e) {
    console.warn("toPng 실패, canvas fallback 진행", e);
  }

  // 2) fallback: foreignObject+canvas (일부 케이스에서 더 안정적)
  await captureViaCanvas(el, filename);
}
