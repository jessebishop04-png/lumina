"use client";

import type { CropRect } from "@/lib/types";
import { useActiveImage, useEditorStore } from "@/lib/store/editorStore";

const ASPECT_PRESETS: { label: string; ratio: number | null }[] = [
  { label: "Free", ratio: null },
  { label: "1:1", ratio: 1 },
  { label: "4:5", ratio: 4 / 5 },
  { label: "16:9", ratio: 16 / 9 },
  { label: "3:2", ratio: 3 / 2 },
  { label: "9:16", ratio: 9 / 16 },
];

function applyAspectRatio(current: CropRect, ratio: number): CropRect {
  const cx = current.x + current.width / 2;
  const cy = current.y + current.height / 2;
  let width = current.width;
  let height = width / ratio;
  if (height > 1) {
    height = 1;
    width = height * ratio;
  }
  if (width > 1) {
    width = 1;
    height = width / ratio;
  }
  let x = cx - width / 2;
  let y = cy - height / 2;
  x = Math.max(0, Math.min(1 - width, x));
  y = Math.max(0, Math.min(1 - height, y));
  return { x, y, width, height };
}

export function CropPanel() {
  const activeImage = useActiveImage();
  const rotateImage = useEditorStore((s) => s.rotateImage);
  const setCrop = useEditorStore((s) => s.setCrop);
  const resetCrop = useEditorStore((s) => s.resetCrop);
  const persistProject = useEditorStore((s) => s.persistProject);

  if (!activeImage) {
    return <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13, padding: 32 }}>Select a photo</p>;
  }

  const btnStyle: React.CSSProperties = {
    flex: 1,
    padding: "10px 8px",
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    background: "var(--color-surface-panel)",
    color: "var(--color-text-primary)",
  };

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-secondary)", marginBottom: 10 }}>
          Rotate
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" style={btnStyle} onClick={() => { rotateImage(-90); void persistProject(); }}>
            ↺ 90°
          </button>
          <button type="button" style={btnStyle} onClick={() => { rotateImage(90); void persistProject(); }}>
            ↻ 90°
          </button>
          <button type="button" style={btnStyle} onClick={() => { rotateImage(180); void persistProject(); }}>
            180°
          </button>
        </div>
      </div>

      <div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-secondary)", marginBottom: 10 }}>
          Aspect ratio
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {ASPECT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              style={{ ...btnStyle, flex: undefined }}
              onClick={() => {
                if (preset.ratio === null) {
                  resetCrop();
                } else {
                  setCrop(applyAspectRatio(activeImage.crop, preset.ratio));
                }
                void persistProject();
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-secondary)", marginBottom: 8 }}>
          Tips
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          Drag the crop box or its handles on the canvas. Rotation and crop are applied non-destructively and included in export.
        </p>
      </div>

      <button
        type="button"
        onClick={() => { resetCrop(); void persistProject(); }}
        style={{ width: "100%", padding: "10px 0", fontSize: 13, color: "var(--color-text-secondary)", borderRadius: 6, border: "1px solid var(--color-border)" }}
      >
        Reset crop
      </button>
    </div>
  );
}
