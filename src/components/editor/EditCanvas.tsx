"use client";

import { CanvasViewport } from "@/components/editor/CanvasViewport";
import { useAdjustedImage } from "@/lib/hooks/useAdjustedImage";
import { useActiveImage, useEditorStore } from "@/lib/store/editorStore";

export function EditCanvas() {
  const activeImage = useActiveImage();
  const showBefore = useEditorStore((s) => s.showBefore);
  const processedImageUrl = useAdjustedImage(activeImage, showBefore);

  const displayUrl = showBefore
    ? activeImage?.originalDataUrl
    : processedImageUrl ?? activeImage?.originalDataUrl;

  if (!activeImage) {
    return (
      <div
        className="lr-canvas-bg"
        style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Select a photo to edit</p>
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
    >
      {showBefore && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--color-surface-panel)",
            border: "1px solid var(--color-border)",
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 11,
            color: "var(--color-text-secondary)",
            zIndex: 5,
          }}
        >
          Original
        </div>
      )}
    </CanvasViewport>
  );
}
