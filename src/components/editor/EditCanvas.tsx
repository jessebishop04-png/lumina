"use client";

import { CanvasViewport } from "@/components/editor/CanvasViewport";
import { useAdjustedImage } from "@/lib/hooks/useAdjustedImage";
import { useActiveImage, useEditorStore } from "@/lib/store/editorStore";
import { DEFAULT_CROP } from "@/lib/types";

function CompareLabel({ text }: { text: string }) {
  return (
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
        fontWeight: 600,
        color: "var(--color-text-secondary)",
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
}

export function EditCanvas() {
  const activeImage = useActiveImage();
  const showBefore = useEditorStore((s) => s.showBefore);
  const processedImageUrl = useAdjustedImage(activeImage, false);

  const editedUrl = processedImageUrl ?? activeImage?.originalDataUrl;

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

  if (showBefore) {
    return (
      <div className="lr-compare-layout">
        <div className="lr-compare-pane">
          <CanvasViewport
            imageId={`${activeImage.id}-original`}
            originalDataUrl={activeImage.originalDataUrl}
            rotation={activeImage.rotation}
            crop={DEFAULT_CROP}
            imageUrl={activeImage.originalDataUrl}
            alt={`${activeImage.name} original`}
          >
            <CompareLabel text="Original" />
          </CanvasViewport>
        </div>
        <div className="lr-compare-pane">
          <CanvasViewport
            imageId={`${activeImage.id}-edited`}
            originalDataUrl={activeImage.originalDataUrl}
            rotation={activeImage.rotation}
            crop={activeImage.crop}
            imageUrl={editedUrl}
            alt={`${activeImage.name} edited`}
          >
            <CompareLabel text="Edited" />
          </CanvasViewport>
        </div>
      </div>
    );
  }

  return (
    <CanvasViewport
      imageId={activeImage.id}
      originalDataUrl={activeImage.originalDataUrl}
      rotation={activeImage.rotation}
      crop={activeImage.crop}
      imageUrl={editedUrl}
      alt={activeImage.name}
    />
  );
}
