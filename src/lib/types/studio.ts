import type { AspectRatioId } from "./generation";

export type StudioTool = "move" | "erase" | "restore";

export interface StudioCanvasState {
  prompt: string;
  aspectRatio: AspectRatioId;
  canvasWidth: number;
  canvasHeight: number;
  offsetX: number;
  offsetY: number;
  imageScale: number;
  padTop: number;
  padRight: number;
  padBottom: number;
  padLeft: number;
  eraseMaskDataUrl: string | null;
}

export interface StudioResultImage {
  id: string;
  url: string;
  createdAt: string;
}

export const DEFAULT_STUDIO_STATE: StudioCanvasState = {
  prompt: "",
  aspectRatio: "1:1",
  canvasWidth: 1024,
  canvasHeight: 1024,
  offsetX: 0,
  offsetY: 0,
  imageScale: 1,
  padTop: 0,
  padRight: 0,
  padBottom: 0,
  padLeft: 0,
  eraseMaskDataUrl: null,
};

export function getStudioDimensions(aspectRatio: AspectRatioId, base = 1024): { width: number; height: number } {
  const ratios: Record<AspectRatioId, [number, number]> = {
    "1:1": [1, 1],
    "16:9": [16, 9],
    "9:16": [9, 16],
    "4:5": [4, 5],
    "3:2": [3, 2],
    "2:3": [2, 3],
  };
  const [w, h] = ratios[aspectRatio];
  if (w >= h) return { width: base, height: Math.round((base * h) / w) };
  return { width: Math.round((base * w) / h), height: base };
}
