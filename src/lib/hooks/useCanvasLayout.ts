"use client";

import { useEffect, useState } from "react";
import type { CropRect } from "@/lib/types";
import { DEFAULT_CROP } from "@/lib/types";
import { getRotatedDimensions } from "@/lib/image/transformUtils";

const CANVAS_VERTICAL_CHROME = 136;

export interface CanvasLayout {
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
}

function isDefaultCrop(crop: CropRect): boolean {
  return (
    crop.x === DEFAULT_CROP.x &&
    crop.y === DEFAULT_CROP.y &&
    crop.width === DEFAULT_CROP.width &&
    crop.height === DEFAULT_CROP.height
  );
}

export function useCanvasLayout(
  imageId: string | undefined,
  originalDataUrl: string | undefined,
  rotation: number,
  containerRef: React.RefObject<HTMLElement | null>,
  crop: CropRect = DEFAULT_CROP
): CanvasLayout | null {
  const [layout, setLayout] = useState<CanvasLayout | null>(null);

  useEffect(() => {
    if (!imageId || !originalDataUrl) {
      setLayout(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;

      const rotated = getRotatedDimensions(img.naturalWidth, img.naturalHeight, rotation);
      const effectiveWidth = isDefaultCrop(crop) ? rotated.width : Math.round(rotated.width * crop.width);
      const effectiveHeight = isDefaultCrop(crop) ? rotated.height : Math.round(rotated.height * crop.height);
      const maxH = window.innerHeight - CANVAS_VERTICAL_CHROME;
      const containerW = containerRef.current?.clientWidth ?? window.innerWidth - 565;
      const maxW = Math.max(200, containerW - 48);
      const scale = Math.min(maxW / effectiveWidth, maxH / effectiveHeight, 1);

      setLayout({
        width: Math.round(effectiveWidth * scale),
        height: Math.round(effectiveHeight * scale),
        naturalWidth: effectiveWidth,
        naturalHeight: effectiveHeight,
      });
    };
    img.src = originalDataUrl;

    return () => {
      cancelled = true;
    };
  }, [imageId, originalDataUrl, rotation, crop, containerRef]);

  return layout;
}
