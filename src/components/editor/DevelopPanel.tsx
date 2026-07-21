"use client";

import { useState } from "react";
import { ADJUSTMENT_SECTIONS, getAdjustmentsBySection } from "@/lib/constants/adjustments";
import { useActiveImage, useEditorStore } from "@/lib/store/editorStore";
import { Slider } from "@/components/ui/Slider";
import { CropPanel } from "@/components/editor/CropPanel";
import { EditorImaginePrompt } from "@/components/editor/EditorImaginePrompt";

function HistogramPlaceholder() {
  return (
    <div className="editor-panel-histogram">
      <div className="editor-panel-histogram-bars">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="editor-panel-histogram-bar"
            style={{
              height: `${25 + Math.abs(Math.sin(i * 0.5)) * 20}%`,
              opacity: i < 20 ? 0.45 : 0.75,
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
  const resetAdjustment = useEditorStore((s) => s.resetAdjustment);
  const persistProject = useEditorStore((s) => s.persistProject);
  const beginAdjusting = useEditorStore((s) => s.beginAdjusting);
  const endAdjusting = useEditorStore((s) => s.endAdjusting);
  const defs = getAdjustmentsBySection(sectionId);

  if (!activeImage) return null;

  return (
    <div className="editor-panel-section">
      <button className="editor-panel-section-header" onClick={() => setOpen((o) => !o)} type="button">
        <span>{title}</span>
        <span className="editor-panel-section-chevron">{open ? "▼" : "▶"}</span>
      </button>
      {open && (
        <div className="editor-panel-section-body">
          {defs.map((def) => (
            <Slider
              key={def.key}
              variant="lr"
              label={def.label}
              value={activeImage.edits[def.key]}
              min={def.min}
              max={def.max}
              step={def.step}
              defaultValue={def.defaultValue}
              enabled
              onChange={(v) => updateAdjustment(def.key, v)}
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
    <aside className="editor-develop-panel">
      <div className="editor-panel-scroll">
        <div className="editor-panel-pinned">
          <div className="editor-panel-title-row">
            <span className="editor-panel-title">{PANEL_TITLES[editorModule] ?? "Panel"}</span>
          </div>

          {editorModule === "edit" && <HistogramPlaceholder />}

          {activeImage && editorModule === "edit" && (
            <div className="editor-panel-imagine">
              <EditorImaginePrompt compact />
            </div>
          )}
        </div>

        {!activeImage ? (
          <p className="editor-panel-empty">Select a photo from the filmstrip</p>
        ) : editorModule === "crop" ? (
          <CropPanel />
        ) : editorModule === "edit" ? (
          ADJUSTMENT_SECTIONS.map((s, i) => (
            <AccordionSection key={s.id} title={s.label} sectionId={s.id} defaultOpen={i === 0} />
          ))
        ) : null}
      </div>

      {activeImage && editorModule === "edit" && (
        <div className="editor-panel-footer">
          <button
            className="editor-panel-reset-btn"
            onClick={() => {
              resetAllAdjustments();
              persistProject();
            }}
            type="button"
          >
            Reset all adjustments
          </button>
        </div>
      )}
    </aside>
  );
}
