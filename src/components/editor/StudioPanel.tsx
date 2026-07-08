"use client";

import { ASPECT_RATIO_OPTIONS } from "@/lib/types/generation";
import { getStudioDimensions } from "@/lib/types/studio";
import { useActiveImage, useEditorStore } from "@/lib/store/editorStore";

export function StudioPanel() {
  const activeImage = useActiveImage();
  const studio = activeImage?.studio;
  const studioTool = useEditorStore((s) => s.studioTool);
  const studioBrushSize = useEditorStore((s) => s.studioBrushSize);
  const studioTab = useEditorStore((s) => s.studioTab);
  const studioGenerating = useEditorStore((s) => s.studioGenerating);
  const setStudioTool = useEditorStore((s) => s.setStudioTool);
  const setStudioBrushSize = useEditorStore((s) => s.setStudioBrushSize);
  const setStudioTab = useEditorStore((s) => s.setStudioTab);
  const updateStudioState = useEditorStore((s) => s.updateStudioState);
  const resetStudioCanvas = useEditorStore((s) => s.resetStudioCanvas);
  const submitStudioEdit = useEditorStore((s) => s.submitStudioEdit);
  const applyStudioResult = useEditorStore((s) => s.applyStudioResult);

  if (!activeImage || !studio) {
    return <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13, padding: 32 }}>Select a photo</p>;
  }

  const toolBtn = (tool: typeof studioTool): React.CSSProperties => ({
    flex: 1,
    padding: "8px 6px",
    fontSize: 11,
    fontWeight: 500,
    borderRadius: 8,
    border: studioTool === tool ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
    background: studioTool === tool ? "var(--color-accent-soft)" : "var(--color-surface-panel)",
    color: "var(--color-text-primary)",
  });

  const tabBtn = (tab: typeof studioTab): React.CSSProperties => ({
    flex: 1,
    padding: "10px 8px",
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 8,
    border: "none",
    background: studioTab === tab ? "var(--color-accent)" : "transparent",
    color: studioTab === tab ? "#fff" : "var(--color-text-secondary)",
  });

  const results = activeImage.studioResults ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "12px 16px", display: "flex", gap: 6, borderBottom: "1px solid var(--color-border)" }}>
        <button type="button" style={tabBtn("edit")} onClick={() => setStudioTab("edit")}>
          Edit
        </button>
        <button type="button" style={tabBtn("retexture")} onClick={() => setStudioTab("retexture")}>
          Retexture
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-secondary)", margin: "0 0 8px" }}>
          {studioTab === "retexture" ? "Retexture prompt" : "Imagine"}
        </p>
        <textarea
          value={studio.prompt}
          onChange={(e) => updateStudioState({ prompt: e.target.value })}
          placeholder={studioTab === "retexture" ? "Describe the new style…" : "Describe what to generate in erased areas…"}
          rows={3}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-input)",
            color: "var(--color-text-primary)",
            fontSize: 13,
            resize: "vertical",
            fontFamily: "inherit",
            marginBottom: 16,
          }}
        />

        {studioTab === "edit" && (
          <>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-secondary)", margin: "0 0 8px" }}>
              Paint
            </p>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              <button type="button" style={toolBtn("move")} onClick={() => setStudioTool("move")}>
                Move
              </button>
              <button type="button" style={toolBtn("erase")} onClick={() => setStudioTool("erase")}>
                Erase
              </button>
              <button type="button" style={toolBtn("restore")} onClick={() => setStudioTool("restore")}>
                Restore
              </button>
            </div>
            <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 16 }}>
              Brush · {studioBrushSize}px
              <input type="range" min={4} max={80} value={studioBrushSize} onChange={(e) => setStudioBrushSize(Number(e.target.value))} style={{ width: "100%", marginTop: 6 }} />
            </label>
          </>
        )}

        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-secondary)", margin: "0 0 8px" }}>
          Move / Resize
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 12 }}>
          {ASPECT_RATIO_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                const dims = getStudioDimensions(o.id);
                updateStudioState({ aspectRatio: o.id, canvasWidth: dims.width, canvasHeight: dims.height });
              }}
              style={{
                padding: "6px 4px",
                fontSize: 10,
                borderRadius: 6,
                border: studio.aspectRatio === o.id ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                background: "var(--color-surface-panel)",
                color: "var(--color-text-secondary)",
              }}
            >
              {o.id}
            </button>
          ))}
        </div>
        <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 16 }}>
          Zoom out · {Math.round(studio.imageScale * 100)}%
          <input
            type="range"
            min={25}
            max={100}
            value={Math.round(studio.imageScale * 100)}
            onChange={(e) => updateStudioState({ imageScale: Number(e.target.value) / 100 })}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <button
          type="button"
          disabled={studioGenerating || !studio.prompt.trim()}
          onClick={() => void submitStudioEdit()}
          style={{
            width: "100%",
            padding: "12px 0",
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 10,
            background: "var(--color-accent)",
            color: "#fff",
            opacity: studioGenerating || !studio.prompt.trim() ? 0.5 : 1,
            marginBottom: 12,
          }}
        >
          {studioGenerating ? "Generating…" : studioTab === "retexture" ? "Submit Retexture" : "Submit Edit"}
        </button>

        <button type="button" onClick={() => resetStudioCanvas()} style={{ width: "100%", padding: "8px 0", fontSize: 12, color: "var(--color-text-muted)" }}>
          Reset canvas
        </button>

        {results.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-secondary)", margin: "0 0 10px" }}>
              Results
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {results.slice(0, 8).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => void applyStudioResult(r.url)}
                  style={{ padding: 0, border: "1px solid var(--color-border)", borderRadius: 6, overflow: "hidden", cursor: "pointer" }}
                  title="Use this result"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.url} alt="" style={{ width: "100%", display: "block", aspectRatio: "1", objectFit: "cover" }} />
                </button>
              ))}
            </div>
            <p style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 8 }}>Click a result to apply it to your photo</p>
          </div>
        )}
      </div>
    </div>
  );
}
