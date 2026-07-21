"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectImage } from "@/lib/types";
import { DEFAULT_CROP } from "@/lib/types";
import { hasActiveEdits } from "@/lib/constants/adjustments";
import {
  LIVE_PREVIEW_MAX,
  renderAdjustedImage,
  renderAdjustedImageLive,
  tryRenderAdjustedImageLive,
  warmPreviewSource,
} from "@/lib/image/imageProcessor";
import { useEditorStore } from "@/lib/store/editorStore";

const IDLE_DEBOUNCE_MS = 80;
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
  const imageRef = useRef(activeImage);
  const adjustingRef = useRef(isAdjusting);

  imageRef.current = activeImage;
  adjustingRef.current = isAdjusting;

  const sourceKey = activeImage
    ? `${activeImage.id}:${activeImage.rotation}:${JSON.stringify(activeImage.crop)}`
    : null;

  useEffect(() => {
    if (!activeImage || showBefore) return;
    void warmPreviewSource(
      activeImage.originalDataUrl,
      activeImage.rotation,
      activeImage.crop,
      LIVE_PREVIEW_MAX
    );
  }, [activeImage, sourceKey, showBefore]);

  const runWorkerRender = useCallback(() => {
    const image = imageRef.current;
    if (!image || !needsRender(image)) return;

    const generation = ++generationRef.current;
    setIsProcessing(true);

    renderAdjustedImage(image.originalDataUrl, image.edits, image.enabledEdits, {
      maxDimension: PREVIEW_MAX,
      skipDetail: false,
      mimeType: "image/jpeg",
      quality: 0.85,
      rotation: image.rotation,
      crop: image.crop,
      maskDataUrl: image.maskDataUrl,
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
  }, [setIsProcessing]);

  const runLiveRender = useCallback(() => {
    const image = imageRef.current;
    if (!image || !needsRender(image)) return;

    const liveUrl = tryRenderAdjustedImageLive(image.originalDataUrl, image.edits, image.enabledEdits, {
      maxDimension: LIVE_PREVIEW_MAX,
      rotation: image.rotation,
      crop: image.crop,
      maskDataUrl: image.maskDataUrl,
    });

    if (liveUrl) {
      setDisplayUrl(liveUrl);
      return;
    }

    const generation = ++generationRef.current;
    void renderAdjustedImageLive(image.originalDataUrl, image.edits, image.enabledEdits, {
      maxDimension: LIVE_PREVIEW_MAX,
      rotation: image.rotation,
      crop: image.crop,
      maskDataUrl: image.maskDataUrl,
    })
      .then((url) => {
        if (generation === generationRef.current) setDisplayUrl(url);
      })
      .catch(() => {
        // keep previous frame
      });
  }, []);

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

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (isAdjusting) {
      runLiveRender();
      return;
    }

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      runWorkerRender();
    }, IDLE_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    activeImage,
    renderKey,
    showBefore,
    isAdjusting,
    setIsProcessing,
    runLiveRender,
    runWorkerRender,
  ]);

  return displayUrl;
}
