"use client";

import { useEditorStore } from "@/lib/store/editorStore";

function GeneratingCard({ compact = false, sourceName }: { compact?: boolean; sourceName?: string | null }) {
  const label = sourceName ? `Generating version of “${sourceName}”…` : "Generating new version…";

  return (
    <div
      className="generating-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? 10 : 12,
        padding: compact ? "10px 12px" : "14px 16px",
        borderRadius: 12,
        background: "var(--color-surface-panel)",
        border: "1px solid var(--color-accent)",
        boxShadow: "0 0 0 1px color-mix(in srgb, var(--color-accent) 25%, transparent)",
      }}
    >
      <div className="spinner" style={{ width: compact ? 18 : 22, height: compact ? 18 : 22, flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: compact ? 12 : 13,
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          {label}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: compact ? 11 : 12, color: "var(--color-text-muted)" }}>
          This may take 1–3 minutes. The new photo will appear in the filmstrip below.
        </p>
      </div>
    </div>
  );
}

/** Banner below the prompt box while img2img is running. */
export function PromptGeneratingBanner({ compact = false }: { compact?: boolean }) {
  const imagineGenerating = useEditorStore((s) => s.imagineGenerating);
  const imagineSourceImageName = useEditorStore((s) => s.imagineSourceImageName);
  if (!imagineGenerating) return null;

  return (
    <div style={{ marginTop: compact ? 10 : 12 }}>
      <GeneratingCard compact={compact} sourceName={imagineSourceImageName} />
    </div>
  );
}

/** Placeholder thumbnail in the filmstrip while a version is being created. */
export function FilmstripGeneratingSlot() {
  return (
    <div
      aria-label="Generating new version"
      style={{
        flexShrink: 0,
        width: 68,
        height: 68,
        borderRadius: 4,
        overflow: "hidden",
        border: "2px dashed var(--color-accent)",
        background: "var(--color-surface-input)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      <div className="spinner" style={{ width: 18, height: 18 }} />
      <span style={{ fontSize: 8, fontWeight: 600, color: "var(--color-accent)", letterSpacing: "0.04em" }}>
        AI
      </span>
    </div>
  );
}
