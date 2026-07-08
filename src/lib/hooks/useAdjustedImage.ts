"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectImage } from "@/lib/types";
import { DEFAULT_CROP } from "@/lib/types";
import { hasActiveEdits } from "@/lib/constants/adjustments";
import { renderAdjustedImage } from "@/lib/image/imageProcessor";
import { useEditorStore } from "@/lib/store/editorStore";

const LIVE_DEBOUNCE_MS = 50;
const IDLE_DEBOUNCE_MS = 150;
const PREVIEW_MAX = 640;

function needsRender(image: ProjectImage): boolean {
  if (hasActiveEdits(image.edits)) return true;
  if (image.rotation !== 0) return true;
  if (image.maskDataUrl) return true;
  const c = image.crop;
  return c.x !== DEFAULT_CROP.x || c.y !== DEFAULT_CROP.y || c.width !== DEFAULT_CROP.width || c.height !== DEFAULT_CROP.height;
}

export function useAdjustedImage(activeImage: ProjectImage | null, showBefore: boolean) {
  const isAdjusting = useEditorStore((s) => s.isAdjusting);
  const setIsProcessing = useEditorStore((s) => s.setIsProcessing);
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const generationRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderKey = activeImage
    ? JSON.stringify({
        edits: activeImage.edits,
        enabled: activeImage.enabledEdits,
        rotation: activeImage.rotation,
        crop: activeImage.crop,
        mask: activeImage.maskDataUrl,
      })
    : null;

  useEffect(() => {
    if (!activeImage || showBefore) {
      setDisplayUrl(null);
      setIsProcessing(false);
      return;
    }

    if (!needsRender(activeImage)) {
      setDisplayUrl(null);
      setIsProcessing(false);
      return;
    }

    const generation = ++generationRef.current;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const delay = isAdjusting ? LIVE_DEBOUNCE_MS : IDLE_DEBOUNCE_MS;

    debounceRef.current = setTimeout(() => {
      setIsProcessing(true);
      renderAdjustedImage(activeImage.originalDataUrl, activeImage.edits, activeImage.enabledEdits, {
        maxDimension: PREVIEW_MAX,
        skipDetail: isAdjusting,
        mimeType: "image/jpeg",
        quality: isAdjusting ? 0.78 : 0.85,
        rotation: activeImage.rotation,
        crop: activeImage.crop,
        maskDataUrl: activeImage.maskDataUrl,
      })
        .then((url) => {
          if (generation === generationRef.current) setDisplayUrl(url);
        })
        .catch(() => {
          // keep previous frame
        })
        .finally(() => {
          if (generation === generationRef.current) setIsProcessing(false);
        });
    }, delay);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activeImage, renderKey, showBefore, isAdjusting, setIsProcessing]);

  return displayUrl;
}
