"use client";

import { useActiveImage, useEditorStore } from "@/lib/store/editorStore";

export function MaskPanel() {
  const activeImage = useActiveImage();
  const brushSize = useEditorStore((s) => s.maskBrushSize);
  const brushMode = useEditorStore((s) => s.maskBrushMode);
  const setMaskBrushSize = useEditorStore((s) => s.setMaskBrushSize);
  const setMaskBrushMode = useEditorStore((s) => s.setMaskBrushMode);
  const clearMask = useEditorStore((s) => s.clearMask);
  const persistProject = useEditorStore((s) => s.persistProject);

  if (!activeImage) {
    return <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13, padding: 32 }}>Select a photo</p>;
  }

  const modeBtn = (mode: "paint" | "erase"): React.CSSProperties => ({
    flex: 1,
    padding: "10px 8px",
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 8,
    border: brushMode === mode ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
    background: brushMode === mode ? "var(--color-accent-soft)" : "var(--color-surface-panel)",
    color: "var(--color-text-primary)",
  });

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-secondary)", marginBottom: 10 }}>
          Brush
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button type="button" style={modeBtn("paint")} onClick={() => setMaskBrushMode("paint")}>
            Paint
          </button>
          <button type="button" style={modeBtn("erase")} onClick={() => setMaskBrushMode("erase")}>
            Erase
          </button>
        </div>
        <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>
          Size · {brushSize}px
        </label>
        <input
          type="range"
          min={4}
          max={80}
          value={brushSize}
          onChange={(e) => setMaskBrushSize(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>

      <div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-secondary)", marginBottom: 8 }}>
          How it works
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          Paint over areas where you want your adjustments to apply. Unmasked areas stay closer to the original. Switch to Edit to adjust sliders, then return here to refine the mask.
        </p>
      </div>

      <button
        type="button"
        onClick={() => { clearMask(); void persistProject(); }}
        style={{ width: "100%", padding: "10px 0", fontSize: 13, color: "var(--color-text-secondary)", borderRadius: 6, border: "1px solid var(--color-border)" }}
      >
        Clear mask
      </button>
    </div>
  );
}
