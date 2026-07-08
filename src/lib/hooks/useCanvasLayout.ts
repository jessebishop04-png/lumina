"use client";

import { useEffect, useState } from "react";
import { getRotatedDimensions } from "@/lib/image/transformUtils";

const CANVAS_VERTICAL_CHROME = 136;

export interface CanvasLayout {
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
}

export function useCanvasLayout(
  imageId: string | undefined,
  originalDataUrl: string | undefined,
  rotation: number,
  containerRef: React.RefObject<HTMLElement | null>
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
      const maxH = window.innerHeight - CANVAS_VERTICAL_CHROME;
      const containerW = containerRef.current?.clientWidth ?? window.innerWidth - 565;
      const maxW = Math.max(200, containerW - 48);
      const scale = Math.min(maxW / rotated.width, maxH / rotated.height, 1);

      setLayout({
        width: Math.round(rotated.width * scale),
        height: Math.round(rotated.height * scale),
        naturalWidth: rotated.width,
        naturalHeight: rotated.height,
      });
    };
    img.src = originalDataUrl;

    return () => {
      cancelled = true;
    };
  }, [imageId, originalDataUrl, rotation, containerRef]);

  return layout;
}
