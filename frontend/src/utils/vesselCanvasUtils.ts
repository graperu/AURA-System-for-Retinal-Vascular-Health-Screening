/**
 * Utility trích xuất và vẽ lớp mạch máu quang học (Optical Vessel Segmentation) lên canvas.
 * Hỗ trợ:
 * 1. Pre-segmented mask từ AI (vesselMaskUrl / Base64).
 * 2. Thuật toán trích xuất vi mạch quang học client-side từ ảnh đáy mắt gốc (Green-channel isolation).
 * 3. Xử lý an toàn với Cross-Origin / Tainted Canvas.
 */

export interface ProcessVesselOptions {
  isDarkRoom: boolean;
  vesselMaskUrl?: string;
}

export const processVesselOverlayCanvas = (
  sourceImg: HTMLImageElement,
  targetCanvas: HTMLCanvasElement,
  options: ProcessVesselOptions
): void => {
  if (!sourceImg || !targetCanvas) return;
  const w = sourceImg.naturalWidth || sourceImg.width || 400;
  const h = sourceImg.naturalHeight || sourceImg.height || 340;
  if (w === 0 || h === 0) return;

  targetCanvas.width = w;
  targetCanvas.height = h;
  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  // 1. Nếu đã có pre-segmented vesselMaskUrl từ AI / backend
  if (options.vesselMaskUrl && options.vesselMaskUrl.trim().length > 0) {
    const ImageCtor = typeof Image !== 'undefined' ? Image : (globalThis as any)?.Image;
    if (ImageCtor) {
      const maskImg = new ImageCtor();
      maskImg.crossOrigin =
        options.vesselMaskUrl.startsWith('data:') || options.vesselMaskUrl.startsWith('blob:')
          ? undefined
          : 'anonymous';
      maskImg.onload = () => {
        try {
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(maskImg, 0, 0, w, h);
        } catch (err) {
          console.warn('[processVesselOverlayCanvas] Failed to render vesselMaskUrl onto canvas:', err);
        }
      };
      maskImg.src = options.vesselMaskUrl;
    }
    return;
  }

  // 2. Trích xuất vi mạch quang học từ ảnh đáy mắt gốc
  try {
    ctx.drawImage(sourceImg, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance < 14) {
        data[i + 3] = 0;
        continue;
      }

      const vesselSignal = Math.max(0, r - g * 0.82);

      if (options.isDarkRoom) {
        const intensity = Math.min(255, vesselSignal * 2.4 + g * 0.35);
        data[i] = Math.round(intensity * 0.08);
        data[i + 1] = Math.round(intensity * 0.85);
        data[i + 2] = Math.round(intensity * 0.95);
        data[i + 3] = Math.round(Math.min(245, vesselSignal * 2.6 + 35));
      } else {
        const enhancedGreen = Math.min(255, g * 1.35);
        data[i] = Math.round(enhancedGreen * 0.15);
        data[i + 1] = Math.round(enhancedGreen * 0.95);
        data[i + 2] = Math.round(enhancedGreen * 0.45);
        data[i + 3] = Math.round(Math.min(235, vesselSignal * 2.8 + 40));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (err: any) {
    if (err?.name === 'SecurityError' || (err instanceof Error && err.message.includes('tainted'))) {
      console.warn(
        '[processVesselOverlayCanvas] Canvas tainted by cross-origin fundus image. Fallback to clean layer without pixel manipulation.',
        err
      );
      try {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(sourceImg, 0, 0, w, h);
      } catch {
        // Safe no-op
      }
    } else {
      console.warn('[processVesselOverlayCanvas] processVesselOverlayCanvas error:', err);
    }
  }
};
