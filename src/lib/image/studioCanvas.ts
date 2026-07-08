import type { StudioCanvasState } from "@/lib/types/studio";

export interface StudioCompositeInput {
  imageDataUrl: string;
  state: StudioCanvasState;
  displayWidth: number;
  displayHeight: number;
}

export interface StudioCompositeOutput {
  compositeDataUrl: string;
  maskDataUrl: string;
  width: number;
  height: number;
}

export async function buildStudioComposite(input: StudioCompositeInput): Promise<StudioCompositeOutput> {
  const { imageDataUrl, state, displayWidth, displayHeight } = input;
  const img = await loadImage(imageDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = state.canvasWidth;
  canvas.height = state.canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // Checkerboard for empty areas
  drawCheckerboard(ctx, canvas.width, canvas.height);

  const drawW = Math.round(displayWidth * state.imageScale);
  const drawH = Math.round(displayHeight * state.imageScale);
  const innerW = state.canvasWidth - state.padLeft - state.padRight;
  const innerH = state.canvasHeight - state.padTop - state.padBottom;
  const x = Math.round(state.padLeft + (innerW - drawW) / 2 + state.offsetX);
  const y = Math.round(state.padTop + (innerH - drawH) / 2 + state.offsetY);

  ctx.drawImage(img, x, y, drawW, drawH);

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) throw new Error("Could not get canvas context");

  maskCtx.fillStyle = "#000000";
  maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

  if (state.eraseMaskDataUrl) {
    const maskImg = await loadImage(state.eraseMaskDataUrl);
    maskCtx.drawImage(maskImg, 0, 0, maskCanvas.width, maskCanvas.height);
  }

  return {
    compositeDataUrl: canvas.toDataURL("image/jpeg", 0.92),
    maskDataUrl: maskCanvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCheckerboard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const size = 16;
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      ctx.fillStyle = (x / size + y / size) % 2 === 0 ? "#2a2a2a" : "#1a1a1a";
      ctx.fillRect(x, y, size, size);
    }
  }
}

export function applyStudioResultToImage(compositeDataUrl: string): Promise<string> {
  return Promise.resolve(compositeDataUrl);
}
