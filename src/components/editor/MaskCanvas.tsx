"use client";

import { useCallback, useEffect, useRef } from "react";
import { CanvasViewport } from "@/components/editor/CanvasViewport";
import { useAdjustedImage } from "@/lib/hooks/useAdjustedImage";
import { createEmptyMaskDataUrl } from "@/lib/image/transformUtils";
import { useActiveImage, useEditorStore } from "@/lib/store/editorStore";

export function MaskCanvas() {
  const activeImage = useActiveImage();
  const setMaskDataUrl = useEditorStore((s) => s.setMaskDataUrl);
  const brushSize = useEditorStore((s) => s.maskBrushSize);
  const brushMode = useEditorStore((s) => s.maskBrushMode);
  const processedImageUrl = useAdjustedImage(activeImage, false);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const paintingRef = useRef(false);
  const initializedRef = useRef<string | null>(null);

  const displayUrl = processedImageUrl ?? activeImage?.originalDataUrl;

  useEffect(() => {
    if (!activeImage || !overlayRef.current) return;
    const canvas = overlayRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (activeImage.maskDataUrl) {
        const maskImg = new Image();
        maskImg.onload = () => {
          ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
        };
        maskImg.src = activeImage.maskDataUrl;
      }
      initializedRef.current = activeImage.id;
    };
    img.src = displayUrl ?? activeImage.originalDataUrl;
  }, [activeImage, displayUrl]);

  const paint = useCallback(
    (e: React.PointerEvent) => {
      const canvas = overlayRef.current;
      if (!canvas || !activeImage) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const radius = brushSize * scaleX;
      ctx.fillStyle = brushMode === "erase" ? "#000000" : "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    },
    [activeImage, brushMode, brushSize]
  );

  const commitMask = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas || !activeImage) return;
    setMaskDataUrl(canvas.toDataURL("image/png"));
  }, [activeImage, setMaskDataUrl]);

  const ensureMask = useCallback(() => {
    if (!activeImage?.maskDataUrl && overlayRef.current) {
      const { width, height } = overlayRef.current;
      if (width > 0 && height > 0) {
        setMaskDataUrl(createEmptyMaskDataUrl(width, height));
      }
    }
  }, [activeImage, setMaskDataUrl]);

  if (!activeImage) {
    return (
      <div
        className="lr-canvas-bg"
        style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Select a photo to mask</p>
      </div>
    );
  }

  return (
    <CanvasViewport
      imageId={activeImage.id}
      originalDataUrl={activeImage.originalDataUrl}
      rotation={activeImage.rotation}
      imageUrl={displayUrl}
      alt={activeImage.name}
      cursor="crosshair"
      disablePan
      overlay={
        <canvas
          ref={overlayRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.45,
            mixBlendMode: "soft-light",
            pointerEvents: "auto",
            cursor: "crosshair",
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            ensureMask();
            paintingRef.current = true;
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
            paint(e);
          }}
          onPointerMove={(e) => {
            if (paintingRef.current) paint(e);
          }}
          onPointerUp={() => {
            paintingRef.current = false;
            commitMask();
          }}
        />
      }
    />
  );
}
