import type { CropRect } from "@/lib/types";
import { DEFAULT_CROP } from "@/lib/types";

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export function getRotatedDimensions(
  width: number,
  height: number,
  rotation: number
): { width: number; height: number } {
  const r = ((rotation % 360) + 360) % 360;
  if (r === 90 || r === 270) return { width: height, height: width };
  return { width, height };
}

export function normalizeCrop(crop: CropRect | undefined | null): CropRect {
  if (!crop) return { ...DEFAULT_CROP };
  return {
    x: Math.max(0, Math.min(1, crop.x)),
    y: Math.max(0, Math.min(1, crop.y)),
    width: Math.max(0.01, Math.min(1, crop.width)),
    height: Math.max(0.01, Math.min(1, crop.height)),
  };
}

function drawRotatedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  rotation: number
): { width: number; height: number } {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const r = ((rotation % 360) + 360) % 360;
  const dims = getRotatedDimensions(w, h, rotation);

  ctx.save();
  ctx.translate(dims.width / 2, dims.height / 2);
  ctx.rotate((r * Math.PI) / 180);
  if (r === 90) ctx.drawImage(img, -w / 2, -h / 2);
  else if (r === 180) ctx.drawImage(img, -w / 2, -h / 2);
  else if (r === 270) ctx.drawImage(img, -w / 2, -h / 2);
  else ctx.drawImage(img, -w / 2, -h / 2);
  ctx.restore();

  return dims;
}

export async function getTransformedImageData(
  dataUrl: string,
  rotation: number,
  crop: CropRect,
  maxDimension?: number
): Promise<ImageData> {
  const img = await loadImage(dataUrl);
  const normalizedCrop = normalizeCrop(crop);

  const rotatedCanvas = document.createElement("canvas");
  const rotatedDims = getRotatedDimensions(img.naturalWidth, img.naturalHeight, rotation);
  rotatedCanvas.width = rotatedDims.width;
  rotatedCanvas.height = rotatedDims.height;
  const rotatedCtx = rotatedCanvas.getContext("2d");
  if (!rotatedCtx) throw new Error("Could not get canvas context");
  drawRotatedImage(rotatedCtx, img, rotation);

  const sx = Math.round(normalizedCrop.x * rotatedDims.width);
  const sy = Math.round(normalizedCrop.y * rotatedDims.height);
  const sw = Math.max(1, Math.round(normalizedCrop.width * rotatedDims.width));
  const sh = Math.max(1, Math.round(normalizedCrop.height * rotatedDims.height));

  let outW = sw;
  let outH = sh;
  if (maxDimension) {
    const max = Math.max(outW, outH);
    if (max > maxDimension) {
      const scale = maxDimension / max;
      outW = Math.max(1, Math.round(outW * scale));
      outH = Math.max(1, Math.round(outH * scale));
    }
  }

  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) throw new Error("Could not get canvas context");
  outCtx.drawImage(rotatedCanvas, sx, sy, sw, sh, 0, 0, outW, outH);

  return outCtx.getImageData(0, 0, outW, outH);
}

export function compositeWithMask(
  original: ImageData,
  adjusted: ImageData,
  mask: ImageData
): ImageData {
  const width = adjusted.width;
  const height = adjusted.height;
  const out = new Uint8ClampedArray(adjusted.data.length);
  const orig = original.data;
  const adj = adjusted.data;
  const m = mask.data;

  for (let i = 0; i < out.length; i += 4) {
    const blend = m[i] / 255;
    out[i] = orig[i] * (1 - blend) + adj[i] * blend;
    out[i + 1] = orig[i + 1] * (1 - blend) + adj[i + 1] * blend;
    out[i + 2] = orig[i + 2] * (1 - blend) + adj[i + 2] * blend;
    out[i + 3] = 255;
  }

  return new ImageData(out, width, height);
}

export async function loadMaskImageData(
  maskDataUrl: string,
  width: number,
  height: number
): Promise<ImageData> {
  const img = await loadImage(maskDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height);
  const gray = new Uint8ClampedArray(data.data.length);
  for (let i = 0; i < data.data.length; i += 4) {
    gray[i] = data.data[i];
    gray[i + 1] = data.data[i];
    gray[i + 2] = data.data[i];
    gray[i + 3] = 255;
  }
  return new ImageData(gray, width, height);
}

export function createEmptyMaskDataUrl(width: number, height: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  return canvas.toDataURL("image/png");
}
