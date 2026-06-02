export async function captureElementPng(el: HTMLElement, filename: string): Promise<void> {
  const { width, height } = el.getBoundingClientRect();
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const data = new XMLSerializer().serializeToString(
    new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          ${el.outerHTML}
        </foreignObject>
      </svg>`,
      "image/svg+xml",
    ).documentElement,
  );
  const img = new Image();
  const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (!b) return reject();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = filename;
        a.click();
        resolve();
      }, "image/png");
    };
    img.onerror = reject;
    img.src = url;
  });
}
