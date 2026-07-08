"use client";

import { useState } from "react";
import { ADJUSTMENT_SECTIONS, getAdjustmentsBySection } from "@/lib/constants/adjustments";
import { useActiveImage, useEditorStore } from "@/lib/store/editorStore";
import { Slider } from "@/components/ui/Slider";
import { CropPanel } from "@/components/editor/CropPanel";
import { EditorImaginePrompt } from "@/components/editor/EditorImaginePrompt";

function HistogramPlaceholder() {
  return (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 48 }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${25 + Math.abs(Math.sin(i * 0.5)) * 20}%`,
              background: i < 20 ? "var(--color-border)" : "var(--color-text-muted)",
              borderRadius: 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AccordionSection({
  title,
  sectionId,
  defaultOpen = true,
}: {
  title: string;
  sectionId: "light" | "color" | "detail";
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const activeImage = useActiveImage();
  const updateAdjustment = useEditorStore((s) => s.updateAdjustment);
  const toggleAdjustment = useEditorStore((s) => s.toggleAdjustment);
  const resetAdjustment = useEditorStore((s) => s.resetAdjustment);
  const persistProject = useEditorStore((s) => s.persistProject);
  const beginAdjusting = useEditorStore((s) => s.beginAdjusting);
  const endAdjusting = useEditorStore((s) => s.endAdjusting);
  const defs = getAdjustmentsBySection(sectionId);

  if (!activeImage) return null;

  return (
    <div style={{ borderBottom: "1px solid var(--color-border)" }}>
      <button className="lr-section-header" onClick={() => setOpen((o) => !o)} type="button">
        <span>{title}</span>
        <span style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{open ? "▼" : "▶"}</span>
      </button>
      {open && (
        <div style={{ padding: "8px 16px 16px" }}>
          {defs.map((def) => (
            <Slider
              key={def.key}
              label={def.label}
              value={activeImage.edits[def.key]}
              min={def.min}
              max={def.max}
              step={def.step}
              defaultValue={def.defaultValue}
              enabled={activeImage.enabledEdits[def.key]}
              onChange={(v) => updateAdjustment(def.key, v)}
              onToggle={() => toggleAdjustment(def.key)}
              onAdjustStart={beginAdjusting}
              onAdjustEnd={endAdjusting}
              onReset={() => {
                resetAdjustment(def.key);
                persistProject();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const PANEL_TITLES: Record<string, string> = {
  edit: "Adjustments",
  crop: "Crop & Rotate",
};

export function DevelopPanel() {
  const editorModule = useEditorStore((s) => s.editorModule);
  const activeImage = useActiveImage();
  const resetAllAdjustments = useEditorStore((s) => s.resetAllAdjustments);
  const persistProject = useEditorStore((s) => s.persistProject);

  return (
    <aside
      style={{
        width: 320,
        minWidth: 320,
        flexShrink: 0,
        height: "100%",
        background: "var(--color-surface-panel)",
        borderLeft: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--color-text-secondary)",
          }}
        >
          {PANEL_TITLES[editorModule] ?? "Panel"}
        </span>
      </div>

      {editorModule === "edit" && <HistogramPlaceholder />}

      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeImage && editorModule === "edit" && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
            <EditorImaginePrompt compact />
          </div>
        )}
        {!activeImage ? (
          <p style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: 13, padding: 32 }}>
            Select a photo from the filmstrip
          </p>
        ) : editorModule === "crop" ? (
          <CropPanel />
        ) : (
          ADJUSTMENT_SECTIONS.map((s, i) => (
            <AccordionSection key={s.id} title={s.label} sectionId={s.id} defaultOpen={i === 0} />
          ))
        )}
      </div>

      {activeImage && editorModule === "edit" && (
        <div style={{ padding: 12, borderTop: "1px solid var(--color-border)" }}>
          <button
            onClick={() => {
              resetAllAdjustments();
              persistProject();
            }}
            type="button"
            style={{ width: "100%", padding: "8px 0", fontSize: 13, color: "var(--color-text-secondary)", borderRadius: 6 }}
          >
            Reset all adjustments
          </button>
        </div>
      )}
    </aside>
  );
}
