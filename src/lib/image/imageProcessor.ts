import type { AdjustmentKey, CropRect, EditAdjustments } from "@/lib/types";
import { DEFAULT_ADJUSTMENTS, DEFAULT_CROP } from "@/lib/types";
import { applyAdjustmentsToBuffer } from "./adjustmentsCore";
import { cancelPendingWorkerJobs, processImageInWorker } from "./imageWorkerClient";
import {
  compositeWithMask,
  getTransformedImageData,
  loadMaskImageData,
} from "./transformUtils";

export interface RenderOptions {
  maxDimension?: number;
  skipDetail?: boolean;
  mimeType?: "image/jpeg" | "image/png";
  quality?: number;
  rotation?: number;
  crop?: CropRect;
  maskDataUrl?: string | null;
}

const PREVIEW_MAX = 640;
const imageElementCache = new Map<string, Promise<HTMLImageElement>>();
const previewDataCache = new Map<string, ImageData>();
let outputCanvas: HTMLCanvasElement | null = null;

export function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  const cached = imageElementCache.get(dataUrl);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
  imageElementCache.set(dataUrl, promise);
  return promise;
}

async function getSourceImageData(
  dataUrl: string,
  maxDimension: number,
  rotation = 0,
  crop = DEFAULT_CROP
): Promise<ImageData> {
  const cacheKey = `${dataUrl}@${maxDimension}@${rotation}@${JSON.stringify(crop)}`;
  const cached = previewDataCache.get(cacheKey);
  if (cached) return cached;

  const imageData = await getTransformedImageData(dataUrl, rotation, crop, maxDimension);
  previewDataCache.set(cacheKey, imageData);
  return imageData;
}

function getFullImageData(
  dataUrl: string,
  rotation = 0,
  crop = DEFAULT_CROP
): Promise<ImageData> {
  const cacheKey = `${dataUrl}@full@${rotation}@${JSON.stringify(crop)}`;
  const cached = previewDataCache.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  return getTransformedImageData(dataUrl, rotation, crop).then((imageData) => {
    previewDataCache.set(cacheKey, imageData);
    return imageData;
  });
}

function imageDataToDataUrl(
  imageData: ImageData,
  mimeType: "image/jpeg" | "image/png" = "image/jpeg",
  quality = 0.9
): string {
  if (!outputCanvas) outputCanvas = document.createElement("canvas");
  outputCanvas.width = imageData.width;
  outputCanvas.height = imageData.height;
  const ctx = outputCanvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.putImageData(imageData, 0, 0);
  return outputCanvas.toDataURL(mimeType, mimeType === "image/jpeg" ? quality : undefined);
}

export function clearImageCache(dataUrl?: string): void {
  if (dataUrl) {
    imageElementCache.delete(dataUrl);
    for (const key of previewDataCache.keys()) {
      if (key.startsWith(dataUrl)) previewDataCache.delete(key);
    }
    return;
  }
  imageElementCache.clear();
  previewDataCache.clear();
}

export function renderAdjustedImage(
  originalDataUrl: string,
  edits: EditAdjustments,
  enabledEdits: Record<AdjustmentKey, boolean>,
  options: RenderOptions = {}
): Promise<string> {
  const maxDimension = options.maxDimension ?? PREVIEW_MAX;
  const skipDetail = options.skipDetail ?? maxDimension <= PREVIEW_MAX;
  const rotation = options.rotation ?? 0;
  const crop = options.crop ?? DEFAULT_CROP;
  const maskDataUrl = options.maskDataUrl ?? null;

  return getSourceImageData(originalDataUrl, maxDimension, rotation, crop)
    .then((source) =>
      processImageInWorker(source, edits, enabledEdits, skipDetail).then(async (adjusted) => {
        let result = adjusted;
        if (maskDataUrl) {
          const mask = await loadMaskImageData(maskDataUrl, source.width, source.height);
          result = compositeWithMask(source, adjusted, mask);
        }
        return imageDataToDataUrl(result, options.mimeType ?? "image/jpeg", options.quality ?? 0.85);
      })
    );
}

export function renderAdjustedImageForExport(
  originalDataUrl: string,
  edits: EditAdjustments,
  enabledEdits: Record<AdjustmentKey, boolean>,
  options: Pick<RenderOptions, "rotation" | "crop" | "maskDataUrl"> = {}
): Promise<string> {
  const rotation = options.rotation ?? 0;
  const crop = options.crop ?? DEFAULT_CROP;
  const maskDataUrl = options.maskDataUrl ?? null;

  return getFullImageData(originalDataUrl, rotation, crop).then((source) =>
    processImageInWorker(source, edits, enabledEdits, false).then(async (adjusted) => {
      let result = adjusted;
      if (maskDataUrl) {
        const mask = await loadMaskImageData(maskDataUrl, source.width, source.height);
        result = compositeWithMask(source, adjusted, mask);
      }
      return imageDataToDataUrl(result, "image/jpeg", 0.92);
    })
  );
}

export async function ensureDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch generated image (${res.status})`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function createThumbnail(dataUrl: string, maxSize = 200, quality = 0.7): Promise<string> {
  return loadImageFromDataUrl(dataUrl).then((img) => {
    const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  });
}

export function createFilmstripThumbnail(dataUrl: string): Promise<string> {
  return createThumbnail(dataUrl, 160, 0.85);
}

export function createLibraryPreview(dataUrl: string): Promise<string> {
  return createThumbnail(dataUrl, 640, 0.9);
}

export async function createImageThumbnails(
  dataUrl: string
): Promise<{ thumbnailDataUrl: string; previewDataUrl: string }> {
  const [thumbnailDataUrl, previewDataUrl] = await Promise.all([
    createFilmstripThumbnail(dataUrl),
    createLibraryPreview(dataUrl),
  ]);
  return { thumbnailDataUrl, previewDataUrl };
}

/** Higher-fidelity resize for img2img reference uploads */
export function createReferenceImage(dataUrl: string, maxSize = 1024): Promise<string> {
  return createThumbnail(dataUrl, maxSize, 0.92);
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function exportImage(
  dataUrl: string,
  format: "jpeg" | "png" | "webp",
  quality: number,
  width: number,
  height: number,
  maintainAspectRatio: boolean
): Promise<Blob> {
  const img = await loadImageFromDataUrl(dataUrl);

  let exportWidth = width || img.naturalWidth;
  let exportHeight = height || img.naturalHeight;

  if (maintainAspectRatio && width && height) {
    const aspect = img.naturalWidth / img.naturalHeight;
    const targetAspect = width / height;
    if (aspect > targetAspect) {
      exportHeight = Math.round(width / aspect);
      exportWidth = width;
    } else {
      exportWidth = Math.round(height * aspect);
      exportHeight = height;
    }
  } else if (width && !height) {
    exportHeight = Math.round((width / img.naturalWidth) * img.naturalHeight);
  } else if (height && !width) {
    exportWidth = Math.round((height / img.naturalHeight) * img.naturalWidth);
  }

  const canvas = document.createElement("canvas");
  canvas.width = exportWidth;
  canvas.height = exportHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(img, 0, 0, exportWidth, exportHeight);

  const mimeType =
    format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";
  const q = quality / 100;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      mimeType,
      format === "png" ? undefined : q
    );
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function resetAdjustments(): EditAdjustments {
  return { ...DEFAULT_ADJUSTMENTS };
}

export function cancelImageProcessing(): void {
  cancelPendingWorkerJobs();
}

// Legacy export used by tests or direct calls
export function applyAdjustments(
  imageData: ImageData,
  edits: EditAdjustments,
  enabledEdits: Record<AdjustmentKey, boolean>,
  options: { skipDetail?: boolean } = {}
): ImageData {
  const output = applyAdjustmentsToBuffer(
    imageData.data,
    imageData.width,
    imageData.height,
    edits,
    enabledEdits,
    options
  );
  return new ImageData(new Uint8ClampedArray(output), imageData.width, imageData.height);
}

export function getImageDataFromImage(img: HTMLImageElement): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
